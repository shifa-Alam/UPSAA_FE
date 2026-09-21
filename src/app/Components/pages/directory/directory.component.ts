import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { MemberService, PublicMember, PublicMemberFilter } from '../../../Services/member.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

const PAGE_SIZE = 24;

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.scss'
})
export class DirectoryComponent implements OnInit, OnDestroy {
  members: PublicMember[] = [];
  loading = true;
  loadError = false;

  pageNumber = 1;
  totalPages = 0;
  totalItems = 0;

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  filters = {
    name: '',
    bloodGroup: '',
    city: '',
    batch: '',
  };

  private refresh$ = new Subject<void>();

  constructor(private memberService: MemberService) { }

  ngOnInit(): void {
    this.refresh$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading = true;
        this.loadError = false;
        const filter: PublicMemberFilter = {
          pageNumber: this.pageNumber,
          pageSize: PAGE_SIZE,
          fullName: this.filters.name.trim() || undefined,
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
    this.filters = { name: '', bloodGroup: '', city: '', batch: '' };
    this.onFilterChange();
  }

  private fetch(): void {
    this.refresh$.next();
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
