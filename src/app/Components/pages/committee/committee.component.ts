import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CommitteeService, Committee, CommitteePosition, CommitteeSummary } from '../../../Services/committee.service';
import { LanguageService } from '../../../Services/language.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';

interface CommitteeCard {
  memberName: string;
  photo: string | null;
  positionName: string;
  batch?: number | null;
}

interface CommitteeGroup {
  /** i18n key for the section heading; falls back to `title` (a raw position name). */
  titleKey?: string;
  title?: string;
  eyebrowKey: string;
  cards: CommitteeCard[];
  compact?: boolean;
}

@Component({
  selector: 'app-committee',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, EmptyStateComponent, RevealDirective, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './committee.component.html',
  styleUrl: './committee.component.scss'
})
export class CommitteeComponent implements OnInit {
  loading = true;
  loadError = false;

  /** Priority 1 (President) — shown as the featured portrait. */
  president: CommitteeCard | null = null;
  /** Everyone else, bucketed into the page's sections below the president. */
  groups: CommitteeGroup[] = [];
  electionDate: string | null = null;
  termLabel: string | null = null;

  /** Published committees, newest first — the term picker shows when there's more than one. */
  history: CommitteeSummary[] = [];
  /** Committee id on screen; null = the current one. */
  viewingId: number | null = null;
  currentId: number | null = null;

  constructor(private committeeService: CommitteeService, private languageService: LanguageService) { }

  ngOnInit(): void {
    // current() emits this browser's saved copy first (instant on repeat visits), then
    // the fresh one if it changed.
    this.committeeService.current().pipe(catchError(() => of(null))).subscribe(committee => {
      this.currentId = committee?.committeeId ?? null;
      if (this.viewingId === null || this.viewingId === this.currentId) this.show(committee);
    });

    this.committeeService.history().pipe(catchError(() => of([]))).subscribe(list => this.history = list);
  }

  /** Switch to a published term (null = current). */
  selectTerm(id: number | null): void {
    const target = id === this.currentId ? null : id;
    if (target === this.viewingId) return;
    this.viewingId = target;
    this.loading = true;
    const source$ = target === null ? this.committeeService.current() : this.committeeService.get(target);
    source$.pipe(catchError(() => of(null))).subscribe(c => this.show(c));
  }

  get viewingPast(): boolean {
    return this.viewingId !== null && this.viewingId !== this.currentId;
  }

  isSelected(term: CommitteeSummary): boolean {
    return this.viewingId === null ? term.isCurrent : term.id === this.viewingId;
  }

  private show(committee: Committee | null): void {
    this.loading = false;

    if (!committee || !committee.positions || !committee.positions.length) {
      this.loadError = true;
      this.president = null;
      this.groups = [];
      return;
    }

    this.loadError = false;
    this.electionDate = committee.electionDate || null;
    this.termLabel = committee.termLabel;
    this.build(committee.positions);
  }

  private build(positions: CommitteePosition[]): void {
    const flatten = (group: CommitteePosition[]): CommitteeCard[] =>
      group.flatMap(pos => pos.members.map(m => ({
        memberName: m.memberName,
        photo: m.photo,
        batch: m.batch,
        positionName: pos.positionName,
      })));

    const [first, ...rest] = flatten(positions.slice(0, 1));
    this.president = first ?? null;

    // Too few positions to split meaningfully — everyone else is "leadership".
    if (positions.length <= 3) {
      this.groups = [
        { titleKey: 'committee.sections.leadership', eyebrowKey: 'committee.sections.leadershipEyebrow', cards: [...rest, ...flatten(positions.slice(1))] },
      ];
    } else {
      // Next two positions are senior leadership; everything up to the last position
      // is office bearers; the final (lowest-priority) position — typically Executive
      // Members — gets its own compact section under its real name.
      const last = positions[positions.length - 1];
      this.groups = [
        { titleKey: 'committee.sections.leadership', eyebrowKey: 'committee.sections.leadershipEyebrow', cards: [...rest, ...flatten(positions.slice(1, 3))] },
        { titleKey: 'committee.sections.officeBearers', eyebrowKey: 'committee.sections.officeBearersEyebrow', cards: flatten(positions.slice(3, positions.length - 1)) },
        { title: last.positionName, eyebrowKey: 'committee.sections.membersEyebrow', cards: flatten([last]), compact: true },
      ];
    }
    this.groups = this.groups.filter(g => g.cards.length > 0);
  }

  electedOn(): string {
    if (!this.electionDate) return '';
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(this.electionDate));
  }

  formatBatch(batch: number): string {
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: false }).format(batch);
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
