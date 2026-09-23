import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { VoteService, CommitteePosition } from '../../../Services/vote.service';
import { LanguageService } from '../../../Services/language.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';

interface CommitteeCard {
  memberName: string;
  photo: string | null;
  positionName: string;
  batch?: number;
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

  constructor(private voteService: VoteService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.voteService.getPublicCommittee().pipe(
      catchError(() => of(null))
    ).subscribe(committee => {
      this.loading = false;

      if (!committee || !committee.positions || !committee.positions.length) {
        this.loadError = true;
        return;
      }

      this.electionDate = committee.electionDate || null;
      this.build(committee.positions);
    });
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
