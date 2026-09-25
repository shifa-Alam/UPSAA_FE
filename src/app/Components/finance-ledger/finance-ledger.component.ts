import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { catchError, Observable, of } from 'rxjs';
import { ConfirmService } from '../../Services/confirm.service';
import {
  FinanceService, LedgerEntry, LedgerEntryInput, LedgerFilter,
  LedgerType, CategoryTotal, MonthlyTotal, LedgerSummaryResponse
} from '../../Services/finance.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';
import { toDateOnly, todayDateOnly } from '../../Utils/date-utils';

const PAGE_SIZE = 15;
// Export/print need every filtered row, not one page.
const EXPORT_PAGE_SIZE = 100000;

export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';

function csvCell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  // Leading =,+,-,@ would make Excel evaluate the cell as a formula.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-finance-ledger',
  standalone: true,
  imports: [SkeletonComponent, 
    CommonModule, FormsModule, MatIconModule,
    AdminHeaderComponent, SectionCardComponent, EmptyStateComponent, TranslatePipe
  ],
  templateUrl: './finance-ledger.component.html',
  styleUrl: './finance-ledger.component.scss'
})
export class FinanceLedgerComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  /** Route data `readOnly: true` — the members' accounts view (/portal/accounts): no editing, no receipts. */
  readonly readOnly = inject(ActivatedRoute).snapshot.data['readOnly'] === true;
  entries: LedgerEntry[] = [];
  incomeByCategory: CategoryTotal[] = [];
  expenseByCategory: CategoryTotal[] = [];
  totalIncome = 0;
  totalExpense = 0;
  balance = 0;
  monthlyTotals: MonthlyTotal[] = [];
  openingBalance: number | null = null;

  readonly presets: PeriodPreset[] = ['thisMonth', 'lastMonth', 'thisYear', 'lastYear'];
  exporting = false;
  printing = false;

  pageNumber = 1;
  totalPages = 0;
  totalItems = 0;

  loading = true;
  categories: string[] = [];

  filters: { from: string; to: string; type: LedgerType | ''; category: string } = {
    from: '', to: '', type: '', category: ''
  };

  showForm = false;
  saving = false;
  editingId: number | null = null;
  form: LedgerEntryInput = this.emptyForm();
  selectedFile: File | null = null;
  selectedFileName = '';
  existingAttachmentUrl: string | null = null;
  downloadingId: number | null = null;

  constructor(private financeService: FinanceService, private snackbar: SnackbarService, private languageService: LanguageService) { }

  ngOnInit(): void {
    if (!this.readOnly) this.loadCategories();
    this.fetch();
  }

  private report(filter: LedgerFilter): Observable<LedgerSummaryResponse> {
    return this.readOnly ? this.financeService.overview(filter) : this.financeService.filter(filter);
  }

  private emptyForm(): LedgerEntryInput {
    return { entryDate: todayDateOnly(), type: 'Income', category: '', description: '', amount: 0, reference: '' };
  }

  onFilterChange(): void {
    this.pageNumber = 1;
    this.fetch();
  }

  resetFilters(): void {
    this.filters = { from: '', to: '', type: '', category: '' };
    this.onFilterChange();
  }

  applyPreset(preset: PeriodPreset): void {
    const { from, to } = this.presetRange(preset);
    this.filters.from = from;
    this.filters.to = to;
    this.onFilterChange();
  }

  isPresetActive(preset: PeriodPreset): boolean {
    const { from, to } = this.presetRange(preset);
    return this.filters.from === from && this.filters.to === to;
  }

  private presetRange(preset: PeriodPreset): { from: string; to: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    switch (preset) {
      case 'thisMonth': return { from: toDateOnly(new Date(y, m, 1))!, to: toDateOnly(new Date(y, m + 1, 0))! };
      case 'lastMonth': return { from: toDateOnly(new Date(y, m - 1, 1))!, to: toDateOnly(new Date(y, m, 0))! };
      case 'thisYear': return { from: `${y}-01-01`, to: `${y}-12-31` };
      case 'lastYear': return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
    }
  }

  get closingBalance(): number | null {
    return this.openingBalance === null ? null : this.openingBalance + this.balance;
  }

  monthLabel(m: MonthlyTotal): string {
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(m.year, m.month - 1, 1).toLocaleDateString(locale, { month: 'short', year: 'numeric' });
  }

  exportCsv(): void {
    this.exporting = true;
    this.fetchAll().subscribe(res => {
      this.exporting = false;
      if (!res) return;

      const t = (k: string) => this.languageService.translate(`financeLedger.${k}`);
      const rows: (string | number)[][] = [
        [t('colDate'), t('colType'), t('colCategory'), t('colDescription'), t('referenceLabel'), t('typeIncome'), t('typeExpense')],
        ...res.entries.map(e => [
          e.entryDate.slice(0, 10),
          e.type === 'Income' ? t('typeIncome') : t('typeExpense'),
          e.category,
          e.description ?? '',
          e.reference ?? '',
          e.type === 'Income' ? e.amount : '',
          e.type === 'Expense' ? e.amount : ''
        ]),
        [],
        [t('statIncome'), '', '', '', '', res.totalIncome, ''],
        [t('statExpense'), '', '', '', '', '', res.totalExpense],
        [t('statBalance'), '', '', '', '', res.balance, '']
      ];
      if (res.openingBalance !== null) {
        rows.push([t('openingBalance'), '', '', '', '', res.openingBalance, '']);
        rows.push([t('closingBalance'), '', '', '', '', res.openingBalance + res.balance, '']);
      }

      const csv = rows.map(r => r.map(csvCell).join(',')).join('\r\n');
      // BOM so Excel opens Bangla text as UTF-8.
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      this.saveBlob(blob, `ledger-${this.periodSlug()}.csv`);
    });
  }

  printReport(): void {
    // Open synchronously inside the click so popup blockers allow it; fill it once data arrives.
    const win = window.open('', '_blank');
    if (!win) {
      this.snackbar.showError(this.languageService.translate('financeLedger.popupBlockedError'));
      return;
    }
    win.document.write(`<p style="font-family:sans-serif">${escapeHtml(this.languageService.translate('financeLedger.loading'))}</p>`);

    this.printing = true;
    this.fetchAll().subscribe(res => {
      this.printing = false;
      if (!res) {
        win.close();
        return;
      }
      win.document.open();
      win.document.write(this.buildReportHtml(res));
      win.document.close();
      win.focus();
      win.print();
    });
  }

  private buildReportHtml(res: LedgerSummaryResponse): string {
    const t = (k: string) => escapeHtml(this.languageService.translate(`financeLedger.${k}`));
    const lang = this.languageService.lang();
    const money = (n: number) => '৳' + n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-IN', { maximumFractionDigits: 2 });
    const period = this.filters.from || this.filters.to
      ? `${escapeHtml(this.filters.from || '…')} — ${escapeHtml(this.filters.to || '…')}`
      : t('allTime');
    const filterNotes = [
      this.filters.type ? `${t('colType')}: ${this.filters.type === 'Income' ? t('typeIncome') : t('typeExpense')}` : '',
      this.filters.category ? `${t('colCategory')}: ${escapeHtml(this.filters.category)}` : ''
    ].filter(Boolean).join(' · ');

    const summaryRows = [
      res.openingBalance !== null ? `<tr><th>${t('openingBalance')}</th><td>${money(res.openingBalance)}</td></tr>` : '',
      `<tr><th>${t('statIncome')}</th><td class="inc">${money(res.totalIncome)}</td></tr>`,
      `<tr><th>${t('statExpense')}</th><td class="exp">${money(res.totalExpense)}</td></tr>`,
      `<tr><th>${t('netForPeriod')}</th><td>${money(res.balance)}</td></tr>`,
      res.openingBalance !== null ? `<tr class="strong"><th>${t('closingBalance')}</th><td>${money(res.openingBalance + res.balance)}</td></tr>` : ''
    ].join('');

    const monthRows = res.monthlyTotals.map(m => `
      <tr><td>${escapeHtml(this.monthLabel(m))}</td><td class="num inc">${money(m.income)}</td>
      <td class="num exp">${money(m.expense)}</td><td class="num">${money(m.income - m.expense)}</td></tr>`).join('');

    const entryRows = res.entries.map(e => `
      <tr><td>${escapeHtml(e.entryDate.slice(0, 10))}</td>
      <td>${e.type === 'Income' ? t('typeIncome') : t('typeExpense')}</td>
      <td>${escapeHtml(e.category)}</td>
      <td>${escapeHtml(e.description ?? '')}${e.reference ? ` <small>(${escapeHtml(e.reference)})</small>` : ''}</td>
      <td class="num ${e.type === 'Income' ? 'inc' : 'exp'}">${e.type === 'Income' ? '+' : '-'}${money(e.amount)}</td></tr>`).join('');

    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<title>${t('reportTitle')} — ${period}</title>
<style>
  body{font-family:'Noto Sans Bengali','Segoe UI',Arial,sans-serif;color:#111;margin:24px;font-size:12px}
  h1{font-size:18px;margin:0 0 4px}
  .meta{color:#555;margin:0 0 16px}
  h2{font-size:14px;margin:20px 0 8px}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;vertical-align:top}
  thead th{background:#f1f3f5}
  .summary{width:auto;min-width:320px}
  .summary th{background:#f8f9fa;font-weight:600}
  .summary td{text-align:right}
  .strong th,.strong td{font-weight:700}
  .num{text-align:right;white-space:nowrap}
  .inc{color:#2e7d32}.exp{color:#c62828}
  small{color:#666}
  @media print{body{margin:0}thead{display:table-header-group}tr{page-break-inside:avoid}}
</style></head><body>
<h1>${t('reportTitle')}</h1>
<p class="meta">${t('reportPeriod')}: ${period}${filterNotes ? ' · ' + filterNotes : ''} · ${t('reportGenerated')}: ${escapeHtml(new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB'))}</p>
<table class="summary">${summaryRows}</table>
${res.monthlyTotals.length > 1 ? `<h2>${t('monthlyBreakdown')}</h2>
<table><thead><tr><th>${t('colMonth')}</th><th class="num">${t('typeIncome')}</th><th class="num">${t('typeExpense')}</th><th class="num">${t('colNet')}</th></tr></thead><tbody>${monthRows}</tbody></table>` : ''}
<h2>${t('allTransactions')} (${res.totalItems})</h2>
<table><thead><tr><th>${t('colDate')}</th><th>${t('colType')}</th><th>${t('colCategory')}</th><th>${t('colDescription')}</th><th class="num">${t('colAmount')}</th></tr></thead>
<tbody>${entryRows}</tbody></table>
</body></html>`;
  }

  private fetchAll(): Observable<LedgerSummaryResponse | null> {
    return this.report({ ...this.currentFilter(), pageNumber: 1, pageSize: EXPORT_PAGE_SIZE }).pipe(
      catchError(() => {
        this.snackbar.showError(this.languageService.translate('financeLedger.reportFailedError'));
        return of(null);
      })
    );
  }

  private periodSlug(): string {
    if (!this.filters.from && !this.filters.to) return 'all';
    return `${this.filters.from || 'start'}_to_${this.filters.to || todayDateOnly()}`;
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(objectUrl);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageNumber) return;
    this.pageNumber = page;
    this.fetch();
  }

  /** Bar length for the category breakdown — a category's share of its list total. */
  barPct(item: CategoryTotal, list: CategoryTotal[]): number {
    const total = list.reduce((sum, c) => sum + (c.amount || 0), 0);
    return total > 0 ? Math.max(2, (item.amount / total) * 100) : 0;
  }

  openNewForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.clearFile();
    this.existingAttachmentUrl = null;
    this.showForm = true;
  }

  editEntry(entry: LedgerEntry): void {
    this.editingId = entry.id;
    this.form = {
      entryDate: entry.entryDate.slice(0, 10),
      type: entry.type,
      category: entry.category,
      description: entry.description ?? '',
      amount: entry.amount,
      reference: entry.reference ?? ''
    };
    this.clearFile();
    this.existingAttachmentUrl = entry.attachmentUrl ?? null;
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.clearFile();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.selectedFileName = file?.name ?? '';
  }

  clearFile(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
  }

  downloadAttachment(entry: LedgerEntry): void {
    if (!entry.attachmentUrl) return;

    this.downloadingId = entry.id;
    this.financeService.downloadAttachment(entry.attachmentUrl).pipe(
      catchError(() => {
        this.snackbar.showError(this.languageService.translate('financeLedger.downloadFailedError'));
        return of(null);
      })
    ).subscribe(blob => {
      this.downloadingId = null;
      if (!blob) return;
      this.saveBlob(blob, `${entry.category}-${entry.entryDate.slice(0, 10)}`);
    });
  }

  submitForm(): void {
    if (!this.form.category.trim()) {
      this.snackbar.showError(this.languageService.translate('financeLedger.categoryRequiredError'));
      return;
    }
    if (!this.form.amount || this.form.amount <= 0) {
      this.snackbar.showError(this.languageService.translate('financeLedger.amountRequiredError'));
      return;
    }

    this.saving = true;
    const payload: LedgerEntryInput = {
      ...this.form,
      category: this.form.category.trim(),
      description: this.form.description?.trim() || undefined,
      reference: this.form.reference?.trim() || undefined,
    };

    const request = this.editingId
      ? this.financeService.updateEntry(this.editingId, payload, this.selectedFile)
      : this.financeService.createEntry(payload, this.selectedFile);

    request.pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('financeLedger.saveFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      this.snackbar.showSuccess(this.editingId
        ? this.languageService.translate('financeLedger.updateSuccess')
        : this.languageService.translate('financeLedger.addSuccess'));
      this.showForm = false;
      this.editingId = null;
      this.clearFile();
      this.loadCategories();
      this.fetch();
    });
  }

  confirmDelete(entry: LedgerEntry): void {
    this.confirmService.askDelete(`${entry.category} (৳${entry.amount})`, this.languageService.translate('financeLedger.deleteConfirm')).subscribe(ok => {
      if (!ok) return;

      // Delete answers 204 with no body, so success must not be judged by the emitted value.
      this.financeService.deleteEntry(entry.id).subscribe({
        next: () => {
          this.snackbar.showSuccess(this.languageService.translate('financeLedger.deleteSuccess'));
          this.fetch();
        },
        error: () => this.snackbar.showError(this.languageService.translate('financeLedger.deleteFailedError'))
      });
    });
  }

  private currentFilter(): LedgerFilter {
    return {
      from: this.filters.from || undefined,
      to: this.filters.to || undefined,
      type: this.filters.type || undefined,
      category: this.filters.category || undefined,
      pageNumber: this.pageNumber,
      pageSize: PAGE_SIZE
    };
  }

  private fetch(): void {
    this.loading = true;
    this.report(this.currentFilter()).pipe(catchError(() => of(null))).subscribe(res => {
      this.loading = false;
      if (!res) return;

      this.entries = res.entries;
      this.totalItems = res.totalItems;
      this.totalPages = res.totalPages;
      this.totalIncome = res.totalIncome;
      this.totalExpense = res.totalExpense;
      this.balance = res.balance;
      this.incomeByCategory = res.incomeByCategory;
      this.expenseByCategory = res.expenseByCategory;
      this.monthlyTotals = res.monthlyTotals ?? [];
      this.openingBalance = res.openingBalance ?? null;
    });
  }

  private loadCategories(): void {
    this.financeService.getCategories().pipe(catchError(() => of([]))).subscribe(cats => {
      this.categories = cats;
    });
  }
}
