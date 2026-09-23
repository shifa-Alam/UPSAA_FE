import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import {
  FinanceService, LedgerEntry, LedgerEntryInput, LedgerFilter,
  LedgerType, CategoryTotal
} from '../../Services/finance.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';
import { todayDateOnly } from '../../Utils/date-utils';

const PAGE_SIZE = 15;


@Component({
  selector: 'app-finance-ledger',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    AdminHeaderComponent, SectionCardComponent, EmptyStateComponent, TranslatePipe
  ],
  templateUrl: './finance-ledger.component.html',
  styleUrl: './finance-ledger.component.scss'
})
export class FinanceLedgerComponent implements OnInit {
  entries: LedgerEntry[] = [];
  incomeByCategory: CategoryTotal[] = [];
  expenseByCategory: CategoryTotal[] = [];
  totalIncome = 0;
  totalExpense = 0;
  balance = 0;

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

  constructor(private financeService: FinanceService, private snackbar: SnackbarService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.loadCategories();
    this.fetch();
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
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
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
      ? this.financeService.updateEntry(this.editingId, payload)
      : this.financeService.createEntry(payload);

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
      this.loadCategories();
      this.fetch();
    });
  }

  confirmDelete(entry: LedgerEntry): void {
    if (!confirm(`"${entry.category}" (৳${entry.amount}) ${this.languageService.translate('financeLedger.deleteConfirm')}`)) return;

    this.financeService.deleteEntry(entry.id).pipe(
      catchError(() => {
        this.snackbar.showError(this.languageService.translate('financeLedger.deleteFailedError'));
        return of(null);
      })
    ).subscribe(res => {
      if (res === null) return;
      this.snackbar.showSuccess(this.languageService.translate('financeLedger.deleteSuccess'));
      this.fetch();
    });
  }

  private fetch(): void {
    this.loading = true;
    const filter: LedgerFilter = {
      from: this.filters.from || undefined,
      to: this.filters.to || undefined,
      type: this.filters.type || undefined,
      category: this.filters.category || undefined,
      pageNumber: this.pageNumber,
      pageSize: PAGE_SIZE
    };

    this.financeService.filter(filter).pipe(catchError(() => of(null))).subscribe(res => {
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
    });
  }

  private loadCategories(): void {
    this.financeService.getCategories().pipe(catchError(() => of([]))).subscribe(cats => {
      this.categories = cats;
    });
  }
}
