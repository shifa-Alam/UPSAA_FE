import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { MemberService, PublicBatch } from '../../../Services/member.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

interface BatchStat {
  labelKey: string;
  value: number;
  shown: number;
  /** Years — no digit grouping, and the count-up starts nearby instead of from 0. */
  plain?: boolean;
}

interface Decade {
  start: number;
  batches: PublicBatch[];
}

@Component({
  selector: 'app-batches',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe],
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

  private isBrowser: boolean;

  constructor(
    private memberService: MemberService,
    private router: Router,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
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
      { labelKey: 'batches.stats.alumni', value: active.reduce((sum, b) => sum + b.alumniCount, 0), shown: 0 },
      { labelKey: 'batches.stats.batches', value: active.length, shown: 0 },
      { labelKey: 'batches.stats.firstBatch', value: active[0].batch, shown: 0, plain: true },
    ];
    this.countUp();
  }

  /** Gentle count-up for the summary band; skipped on the server and for reduced motion. */
  private countUp(): void {
    const reduced = this.isBrowser && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!this.isBrowser || reduced) {
      this.stats.forEach(s => s.shown = s.value);
      return;
    }
    const start = performance.now();
    const duration = 1400;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      this.stats.forEach(s => {
        const from = s.plain ? s.value - 30 : 0;
        s.shown = Math.round(from + (s.value - from) * eased);
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
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
