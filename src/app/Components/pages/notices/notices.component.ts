import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { NoticeService, Notice } from '../../../Services/notice.service';
import { AuthService } from '../../../Services/auth.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

const PAGE_SIZE = 10;
const NEW_WITHIN_DAYS = 7;

/**
 * Full notice board. Served at /notices (public) and /portal/notices (members).
 * A single notice opens via ?id= so the link survives shellRedirectGuard, which
 * forwards query params but not path params.
 */
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-notices',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, FormsModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.scss'
})
export class NoticesComponent implements OnInit {
  private noticeService = inject(NoticeService);
  private languageService = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);

  /** The loaded pages (server-side search + "show more", PAGE_SIZE at a time). */
  notices: Notice[] = [];
  /** Matches for the current search. */
  total = 0;
  /** All visible notices, ignoring the search — decides "empty board" vs "no match". */
  boardTotal = 0;
  loading = true;
  loadingMore = false;
  loadError = false;

  search = '';
  selectedId: number | null = null;
  /** The ?id= notice, fetched on its own when it isn't among the loaded ones. */
  private fetched: Notice | null = null;
  selectedLoading = false;

  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      this.selectedId = Number.isInteger(id) && id > 0 ? id : null;
      this.loadSelected();
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    });

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.noticeService.getPage({ search: q, take: PAGE_SIZE }).pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(page => {
      if (!page) return;
      this.notices = page.items;
      this.total = page.total;
    });

    this.noticeService.getPage({ take: PAGE_SIZE }).pipe(catchError(() => of(null))).subscribe(page => {
      this.loading = false;
      if (!page) {
        this.loadError = true;
        return;
      }
      this.notices = page.items;
      this.total = this.boardTotal = page.total;
    });
  }

  get selected(): Notice | null {
    if (this.selectedId === null) return null;
    return this.notices.find(n => n.id === this.selectedId) ?? (this.fetched?.id === this.selectedId ? this.fetched : null);
  }

  private loadSelected(): void {
    const id = this.selectedId;
    if (id === null || this.notices.some(n => n.id === id) || this.fetched?.id === id) return;
    this.selectedLoading = true;
    this.noticeService.get(id).pipe(catchError(() => of(null))).subscribe(n => {
      this.selectedLoading = false;
      if (n && this.selectedId === id) this.fetched = n;
    });
  }

  onSearchChange(): void {
    this.search$.next(this.search.trim());
  }

  clearSearch(): void {
    this.search = '';
    this.onSearchChange();
  }

  showMore(): void {
    if (this.loadingMore) return;
    this.loadingMore = true;
    this.noticeService.getPage({ search: this.search.trim(), skip: this.notices.length, take: PAGE_SIZE })
      .pipe(catchError(() => of(null)))
      .subscribe(page => {
        this.loadingMore = false;
        if (!page) return;
        const seen = new Set(this.notices.map(n => n.id));
        this.notices = [...this.notices, ...page.items.filter(n => !seen.has(n.id))];
        this.total = page.total;
      });
  }

  isNew(n: Notice): boolean {
    const age = Date.now() - new Date(n.publishedDate).getTime();
    return age >= 0 && age < NEW_WITHIN_DAYS * 24 * 60 * 60 * 1000;
  }

  private get locale(): string {
    return this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  day(n: Notice): string {
    return new Intl.DateTimeFormat(this.locale, { day: 'numeric' }).format(new Date(n.publishedDate));
  }

  month(n: Notice): string {
    return new Intl.DateTimeFormat(this.locale, { month: 'short' }).format(new Date(n.publishedDate));
  }

  year(n: Notice): string {
    return new Intl.DateTimeFormat(this.locale, { year: 'numeric' }).format(new Date(n.publishedDate));
  }

  fullDate(n: Notice): string {
    return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(n.publishedDate));
  }
}
