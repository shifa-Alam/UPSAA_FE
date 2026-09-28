import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { MemberService, PublicBatchDetail } from '../../../Services/member.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { DirectoryComponent } from '../directory/directory.component';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

/**
 * One batch's own page (/batches/2009, or /portal/batches/2009): the year and how many
 * alumni it has, then the directory locked to that batch.
 */
@Component({
  selector: 'app-batch-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, PageHeaderComponent, EmptyStateComponent,
    DirectoryComponent, TranslatePipe],
  templateUrl: './batch-page.component.html',
  styleUrl: './batch-page.component.scss'
})
export class BatchPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private members = inject(MemberService);
  private lang = inject(LanguageService);
  private destroyRef = inject(DestroyRef);

  readonly inPortal = this.router.url.startsWith('/portal');
  readonly batchesLink = this.inPortal ? '/portal/batches' : '/batches';

  year = 0;
  detail: PublicBatchDetail | null = null;
  loading = true;
  notFound = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(p => Number(p.get('year'))),
      tap(year => {
        this.year = year;
        this.detail = null;
        this.loading = true;
        this.notFound = false;
      }),
      switchMap(year => Number.isInteger(year) && year > 1900
        ? this.members.getPublicBatch(year).pipe(catchError(() => of(null)))
        : of(null)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(detail => {
      this.loading = false;
      this.detail = detail;
      this.notFound = !detail || detail.alumniCount === 0;
    });
  }

  get title(): string {
    return `${this.lang.translate('batches.page.titlePrefix')} ${this.num(this.year, true)}`;
  }

  get subtitle(): string {
    return this.detail && this.detail.alumniCount > 0
      ? `${this.num(this.detail.alumniCount)} ${this.lang.translate('batches.page.countSuffix')}`
      : '';
  }

  /** Locale digits (Bangla numerals in bn); `plain` drops grouping for years. */
  num(value: number, plain = false): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: !plain }).format(value);
  }

}
