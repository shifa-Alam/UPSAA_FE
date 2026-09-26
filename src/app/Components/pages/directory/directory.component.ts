import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { MemberService, PublicMember, PublicMemberFilter } from '../../../Services/member.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { LanguageService } from '../../../Services/language.service';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';

const PAGE_SIZE = 24;

import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { SharedElementService } from '../../../Services/shared-element.service';
@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, FormsModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.scss'
})
export class DirectoryComponent implements OnInit, OnDestroy {
  /** The photo that flies into / back from the member's profile (view transition). */
  readonly shared = inject(SharedElementService);
  private router = inject(Router);

  /** Locks the list to one batch (the batch page) and hides the batch field. */
  @Input() batch?: number;
  /** Shown inside another page: no page header and no closing invitation. */
  @Input() embedded = false;

  /** Profile links: /portal/members/:id inside the portal, /members/:id on the public site. */
  readonly profileBase = this.router.url.startsWith('/portal') ? '/portal/members' : '/members';
  members: PublicMember[] = [];
  loading = true;
  loadError = false;

  pageNumber = 1;
  totalPages = 0;
  totalItems = 0;

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  filters = {
    name: '',
    profession: '',
    bloodGroup: '',
    city: '',
    batch: '',
  };

  private refresh$ = new Subject<void>();

  constructor(
    private memberService: MemberService,
    private route: ActivatedRoute,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    // Deep link from the Batch Directory page, e.g. /members?batch=2008.
    const batchParam = this.batch ? String(this.batch) : this.route.snapshot.queryParamMap.get('batch');
    if (batchParam) {
      this.filters.batch = batchParam;
    }
    // …and from the "page not found" search box: /members?name=Rahim.
    const nameParam = this.route.snapshot.queryParamMap.get('name');
    if (nameParam) {
      this.filters.name = nameParam;
    }
    const professionParam = this.route.snapshot.queryParamMap.get('profession');
    if (professionParam) {
      this.filters.profession = professionParam;
    }

    this.refresh$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading = true;
        this.loadError = false;
        const filter: PublicMemberFilter = {
          pageNumber: this.pageNumber,
          pageSize: PAGE_SIZE,
          fullName: this.filters.name.trim() || undefined,
          profession: this.filters.profession.trim() || undefined,
          bloodGroup: this.filters.bloodGroup || undefined,
          currentCity: this.filters.city.trim() || undefined,
          batch: this.filters.batch.trim() ? Number(this.filters.batch.trim()) : undefined,
        };
        return this.memberService.getPublicDirectory(filter).pipe(catchError(() => of(null)));
      })
    ).subscribe(res => {
      this.loading = false;

      if (!res) {
        this.loadError = true;
        this.members = [];
        return;
      }

      this.members = res.members;
      this.totalPages = res.totalPages;
      this.totalItems = res.totalItems;
    });

    this.fetch();
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  /** Any filter change resets to page 1 and re-queries. */
  onFilterChange(): void {
    this.pageNumber = 1;
    this.fetch();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageNumber) return;
    this.pageNumber = page;
    this.fetch();
  }

  resetFilters(): void {
    this.filters = { name: '', profession: '', bloodGroup: '', city: '', batch: this.batch ? String(this.batch) : '' };
    this.onFilterChange();
  }

  private fetch(): void {
    this.refresh$.next();
  }

  get hasFilters(): boolean {
    const f = this.filters;
    return !!(f.name.trim() || f.profession.trim() || f.bloodGroup || f.city.trim() || (!this.batch && f.batch.trim()));
  }

  /** Locale digits (Bangla numerals in bn); `plain` drops grouping for years. */
  num(value: number, plain = false): string {
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: !plain }).format(value);
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
