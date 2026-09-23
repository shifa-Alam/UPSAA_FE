import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, filter, finalize, of, switchMap } from 'rxjs';
import {
  CommitteeService, Committee, CommitteeSeat, CommitteeSummary
} from '../../Services/committee.service';
import { ElectionService, Election } from '../../Services/election.service';
import { MemberService, PublicMember } from '../../Services/member.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { ConfirmService } from '../../Services/confirm.service';
import { LanguageService } from '../../Services/language.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';

/** A seat row in the editor (memberId null = typed name, not linked to a member). */
interface EditableSeat extends CommitteeSeat {
  key: number;
}

/**
 * SuperAdmin: publish a committee from an election's results, keep it up to date
 * (resignations, co-opted members, order) and choose which committee is current.
 * The public page reads the published snapshot instead of counting votes.
 */
@Component({
  selector: 'app-committee-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, AdminHeaderComponent, SectionCardComponent, TranslatePipe],
  templateUrl: './committee-admin.component.html',
  styleUrl: './committee-admin.component.scss'
})
export class CommitteeAdminComponent implements OnInit, OnDestroy {
  committees: CommitteeSummary[] = [];
  listLoading = true;

  // ---- publish ----
  elections: Election[] = [];
  publishElectionId: number | null = null;
  publishTerm = '';
  publishStart = '';
  publishEnd = '';
  preview: Committee | null = null;
  previewLoading = false;
  publishing = false;

  // ---- edit ----
  editingId: number | null = null;
  editTerm = '';
  editStart = '';
  editEnd = '';
  seats: EditableSeat[] = [];
  editLoading = false;
  saving = false;

  // new-seat form
  newPosition = '';
  newPriority: number | null = null;
  newName = '';
  newBatch: number | null = null;
  newMemberId: number | null = null;
  suggestions: PublicMember[] = [];
  private search$ = new Subject<string>();
  private searchSub?: Subscription;
  private nextKey = 1;

  constructor(
    private committeeService: CommitteeService,
    private electionService: ElectionService,
    private memberService: MemberService,
    private snackbar: SnackbarService,
    private confirm: ConfirmService,
    private lang: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadList();
    this.electionService.getElections().pipe(catchError(() => of([]))).subscribe(list => {
      this.elections = [...list].sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
    });

    // Member search for the "add seat" form — the public directory already has name search.
    this.searchSub = this.search$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      filter(q => q.trim().length >= 2),
      switchMap(q => this.memberService.getPublicDirectory({ pageNumber: 1, pageSize: 6, fullName: q.trim() })
        .pipe(catchError(() => of(null))))
    ).subscribe(res => this.suggestions = res?.members ?? []);
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  private t(key: string): string {
    return this.lang.translate(`committeeAdmin.${key}`);
  }

  private error(err: any, fallbackKey: string): void {
    this.snackbar.showError(err?.error?.message || this.t(fallbackKey));
  }

  // ------------------------------------------------------------------ list

  loadList(): void {
    this.listLoading = true;
    this.committeeService.adminList().pipe(finalize(() => this.listLoading = false)).subscribe({
      next: list => this.committees = list,
      error: () => this.committees = []
    });
  }

  makeCurrent(c: CommitteeSummary): void {
    this.confirm.ask({ message: this.t('makeCurrentConfirm').replace('{term}', c.termLabel) })
      .pipe(filter(Boolean), switchMap(() => this.committeeService.makeCurrent(c.id)))
      .subscribe({
        next: () => { this.snackbar.showSuccess(this.t('madeCurrent')); this.loadList(); },
        error: err => this.error(err, 'actionFailed')
      });
  }

  remove(c: CommitteeSummary): void {
    this.confirm.ask({ message: this.t('deleteConfirm').replace('{term}', c.termLabel), danger: true })
      .pipe(filter(Boolean), switchMap(() => this.committeeService.delete(c.id)))
      .subscribe({
        next: () => {
          this.snackbar.showSuccess(this.t('deleted'));
          if (this.editingId === c.id) this.cancelEdit();
          this.loadList();
        },
        error: err => this.error(err, 'actionFailed')
      });
  }

  // ------------------------------------------------------------------ publish

  /** Suggest a term from the election's year, e.g. an election in 2026 → "2026–28". */
  onElectionPicked(): void {
    this.preview = null;
    const e = this.elections.find(x => x.id === this.publishElectionId);
    if (!e || this.publishTerm) return;
    const y = new Date(e.startTime).getFullYear();
    if (!isNaN(y)) this.publishTerm = `${y}–${String((y + 2) % 100).padStart(2, '0')}`;
  }

  loadPreview(): void {
    if (!this.publishElectionId) return;
    this.previewLoading = true;
    this.committeeService.preview(this.publishElectionId).pipe(finalize(() => this.previewLoading = false)).subscribe({
      next: c => this.preview = c,
      error: err => { this.preview = null; this.error(err, 'previewFailed'); }
    });
  }

  get previewSeatCount(): number {
    return this.preview?.positions.reduce((n, p) => n + p.members.length, 0) ?? 0;
  }

  publish(): void {
    if (!this.publishElectionId || !this.publishTerm.trim() || !this.previewSeatCount || this.publishing) return;
    this.confirm.ask({ message: this.t('publishConfirm').replace('{term}', this.publishTerm.trim()) })
      .pipe(filter(Boolean), switchMap(() => {
        this.publishing = true;
        return this.committeeService.publish({
          electionId: this.publishElectionId!,
          termLabel: this.publishTerm.trim(),
          termStart: this.publishStart || null,
          termEnd: this.publishEnd || null,
          makeCurrent: true
        }).pipe(finalize(() => this.publishing = false));
      }))
      .subscribe({
        next: id => {
          this.snackbar.showSuccess(this.t('published'));
          this.preview = null;
          this.publishElectionId = null;
          this.publishTerm = this.publishStart = this.publishEnd = '';
          this.loadList();
          this.startEdit(id);
        },
        error: err => this.error(err, 'publishFailed')
      });
  }

  // ------------------------------------------------------------------ edit

  startEdit(id: number): void {
    this.editingId = id;
    this.editLoading = true;
    this.committeeService.get(id).pipe(finalize(() => this.editLoading = false)).subscribe({
      next: c => {
        this.editTerm = c.termLabel ?? '';
        this.editStart = c.termStart ? c.termStart.slice(0, 10) : '';
        this.editEnd = c.termEnd ? c.termEnd.slice(0, 10) : '';
        this.seats = c.positions.flatMap(p => p.members.map((m, i) => ({
          key: this.nextKey++,
          memberId: m.memberId ?? null,
          memberName: m.memberName,
          batch: m.batch ?? null,
          positionName: p.positionName,
          positionPriority: p.priority,
          sortOrder: i,
          votes: m.votes || null
        })));
        this.resetNewSeat();
      },
      error: err => { this.editingId = null; this.error(err, 'loadFailed'); }
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.seats = [];
  }

  /** Existing positions (name → priority) for the add-seat dropdown. */
  get positionOptions(): { name: string; priority: number }[] {
    const seen = new Map<string, number>();
    for (const s of this.seats) if (!seen.has(s.positionName)) seen.set(s.positionName, s.positionPriority);
    return [...seen].map(([name, priority]) => ({ name, priority })).sort((a, b) => a.priority - b.priority);
  }

  onPositionChosen(): void {
    const known = this.positionOptions.find(p => p.name === this.newPosition.trim());
    if (known) this.newPriority = known.priority;
  }

  move(seat: EditableSeat, dir: -1 | 1): void {
    const i = this.seats.indexOf(seat);
    const j = i + dir;
    if (j < 0 || j >= this.seats.length) return;
    [this.seats[i], this.seats[j]] = [this.seats[j], this.seats[i]];
    this.seats = [...this.seats];
  }

  removeSeat(seat: EditableSeat): void {
    this.seats = this.seats.filter(s => s !== seat);
  }

  onNameInput(): void {
    this.newMemberId = null; // typing again unlinks a previously picked member
    if (this.newName.trim().length < 2) this.suggestions = [];
    this.search$.next(this.newName);
  }

  pickMember(m: PublicMember): void {
    this.newMemberId = m.id;
    this.newName = m.fullName;
    this.newBatch = m.batch ?? null;
    this.suggestions = [];
  }

  get canAddSeat(): boolean {
    return !!this.newPosition.trim() && !!this.newName.trim();
  }

  addSeat(): void {
    if (!this.canAddSeat) return;
    const position = this.newPosition.trim();
    const known = this.positionOptions.find(p => p.name === position);
    const priority = this.newPriority ?? known?.priority ?? (Math.max(0, ...this.seats.map(s => s.positionPriority)) + 1);
    const seat: EditableSeat = {
      key: this.nextKey++,
      memberId: this.newMemberId,
      memberName: this.newName.trim(),
      batch: this.newBatch,
      positionName: position,
      positionPriority: priority,
      sortOrder: 0,
      votes: null
    };
    // Insert after the last seat of the same position so the list stays grouped.
    const last = this.seats.map(s => s.positionName).lastIndexOf(position);
    this.seats = last >= 0 ? [...this.seats.slice(0, last + 1), seat, ...this.seats.slice(last + 1)] : [...this.seats, seat];
    this.resetNewSeat();
  }

  private resetNewSeat(): void {
    this.newPosition = '';
    this.newPriority = null;
    this.newName = '';
    this.newBatch = null;
    this.newMemberId = null;
    this.suggestions = [];
  }

  save(): void {
    if (!this.editingId || this.saving) return;
    if (!this.editTerm.trim()) { this.snackbar.showError(this.t('termRequired')); return; }
    if (!this.seats.length) { this.snackbar.showError(this.t('seatsRequired')); return; }

    // Sort order = position within its group, in the order shown.
    const counters = new Map<string, number>();
    const members = this.seats.map(s => {
      const n = counters.get(s.positionName) ?? 0;
      counters.set(s.positionName, n + 1);
      const { key, ...seat } = s;
      return { ...seat, sortOrder: n };
    });

    this.saving = true;
    this.committeeService.update(this.editingId, {
      termLabel: this.editTerm.trim(),
      termStart: this.editStart || null,
      termEnd: this.editEnd || null,
      members
    }).pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.snackbar.showSuccess(this.t('saved')); this.loadList(); },
      error: err => this.error(err, 'saveFailed')
    });
  }

  // ------------------------------------------------------------------ formatting

  private get locale(): string {
    return this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }

  formatNumber(n: number | null | undefined, plain = false): string {
    return n == null ? '' : new Intl.NumberFormat(this.locale, { useGrouping: !plain }).format(n);
  }

  trackSeat = (_: number, s: EditableSeat) => s.key;
}
