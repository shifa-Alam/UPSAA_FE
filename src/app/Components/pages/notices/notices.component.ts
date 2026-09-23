import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
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
@Component({
  selector: 'app-notices',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.scss'
})
export class NoticesComponent implements OnInit {
  private noticeService = inject(NoticeService);
  private languageService = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);

  notices: Notice[] = [];
  loading = true;
  loadError = false;

  search = '';
  visibleCount = PAGE_SIZE;
  selectedId: number | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      this.selectedId = Number.isInteger(id) && id > 0 ? id : null;
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    });

    this.noticeService.getAll().pipe(catchError(() => of(null))).subscribe(notices => {
      this.loading = false;
      if (!notices) {
        this.loadError = true;
        return;
      }
      this.notices = notices;
    });
  }

  get selected(): Notice | null {
    return this.selectedId === null ? null : this.notices.find(n => n.id === this.selectedId) ?? null;
  }

  get filtered(): Notice[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.notices;
    return this.notices.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  get visible(): Notice[] {
    return this.filtered.slice(0, this.visibleCount);
  }

  onSearchChange(): void {
    this.visibleCount = PAGE_SIZE;
  }

  clearSearch(): void {
    this.search = '';
    this.onSearchChange();
  }

  showMore(): void {
    this.visibleCount += PAGE_SIZE;
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
