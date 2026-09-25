import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { MemberService, PublicBatch } from '../../../Services/member.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { CountUpDirective } from '../../shared/count-up/count-up.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

interface BatchStat {
  labelKey: string;
  value: number;
  /** Years — no digit grouping, and the count-up starts nearby instead of from 0. */
  plain?: boolean;
}

interface Decade {
  start: number;
  batches: PublicBatch[];
}

import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-batches',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, CountUpDirective, TranslatePipe],
  templateUrl: './batches.component.html',
  styleUrl: './batches.component.scss'
})
export class BatchesComponent implements OnInit {
  batches: PublicBatch[] = [];
  /** Batches bucketed by decade, oldest first, for the year-tile grid. */
  decades: Decade[] = [];
  stats: BatchStat[] = [];
  loading = true;
  loadError = false;

  constructor(
    private memberService: MemberService,
    private router: Router,
    private languageService: LanguageService
  ) {
  }

  ngOnInit(): void {
    this.memberService.getPublicBatchSummary().pipe(
      catchError(() => of(null))
    ).subscribe(batches => {
      this.loading = false;

      if (!batches) {
        this.loadError = true;
        return;
      }

      this.batches = [...batches].sort((a, b) => a.batch - b.batch);
      this.buildDecades();
      this.buildStats();
    });
  }

  viewAlumni(batch: number): void {
    this.router.navigate(['/members'], { queryParams: { batch } });
  }

  private buildDecades(): void {
    const map = new Map<number, PublicBatch[]>();
    for (const b of this.batches) {
      const start = Math.floor(b.batch / 10) * 10;
      map.set(start, [...(map.get(start) ?? []), b]);
    }
    this.decades = [...map].map(([start, batches]) => ({ start, batches }));
  }

  private buildStats(): void {
    const active = this.batches.filter(b => b.alumniCount > 0);
    if (!active.length) return;
    this.stats = [
      { labelKey: 'batches.stats.alumni', value: active.reduce((sum, b) => sum + b.alumniCount, 0) },
      { labelKey: 'batches.stats.batches', value: active.length },
      { labelKey: 'batches.stats.firstBatch', value: active[0].batch, plain: true },
    ];
  }

  private get locale(): string {
    return this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  formatNumber(value: number, plain = false): string {
    return new Intl.NumberFormat(this.locale, { useGrouping: !plain }).format(value);
  }

  /** "2000s" / "২০০০-এর দশক". */
  decadeLabel(start: number): string {
    return this.formatNumber(start, true) + this.languageService.translate('batches.decadeSuffix');
  }
}
