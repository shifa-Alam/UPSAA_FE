import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { Business, BusinessSave, CommunityService, FilterCount } from '../../../Services/community.service';
import { AuthService } from '../../../Services/auth.service';
import { ConfirmService } from '../../../Services/confirm.service';
import { LanguageService } from '../../../Services/language.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe } from '../../../Pipes/sized-image.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';

const PAGE = 24;
/** Suggested categories (members can type their own). */
const SUGGESTED = ['খাবার ও রেস্টুরেন্ট', 'পোশাক ও ফ্যাশন', 'স্বাস্থ্য ও চিকিৎসা', 'শিক্ষা ও কোচিং', 'আইটি ও সফটওয়্যার',
  'নির্মাণ ও রিয়েল এস্টেট', 'কৃষি ও খামার', 'দোকান ও খুচরা', 'সেবা ও মেরামত', 'ভ্রমণ ও পরিবহন', 'আইন ও পরামর্শ', 'অন্যান্য'];

const emptyForm = (): BusinessSave => ({
  name: '', category: '', description: '', city: '', address: '', phone: '', website: '', alumniOffer: ''
});

/** Alumni business directory (/businesses, /portal/businesses) — listings go live after staff approval. */
@Component({
  selector: 'app-businesses',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TranslatePipe, SizedImagePipe, PageHeaderComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './businesses.component.html',
  styleUrl: './businesses.component.scss'
})
export class BusinessesComponent implements OnInit, OnDestroy {
  private community = inject(CommunityService);
  private confirm = inject(ConfirmService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);
  auth = inject(AuthService);

  items: Business[] = [];
  total = 0;
  loading = true;
  loadingMore = false;

  categories: FilterCount[] = [];
  category = '';
  search = '';
  private search$ = new Subject<string>();

  mine: Business[] = [];

  showForm = false;
  editingId: number | null = null;
  form: BusinessSave = emptyForm();
  file: File | null = null;
  preview: string | null = null;
  saving = false;

  ngOnInit(): void {
    this.community.businessFilters().pipe(catchError(() => of({ categories: [], cities: [] }))).subscribe(f => this.categories = f.categories);
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(() => this.fetch())).subscribe(page => this.setPage(page));
    this.fetch().subscribe(page => this.setPage(page));
    this.loadMine();
  }

  ngOnDestroy(): void {
    if (this.preview) URL.revokeObjectURL(this.preview);
  }

  get canAdd(): boolean {
    return this.auth.isLoggedIn() && this.auth.hasMemberRecord();
  }

  /** Category suggestions: those already in use, then the defaults. */
  get categoryOptions(): string[] {
    return [...new Set([...this.categories.map(c => c.name), ...SUGGESTED])];
  }

  private fetch(skip = 0) {
    return this.community.businesses({ category: this.category, search: this.search.trim(), skip, take: PAGE })
      .pipe(catchError(() => of({ items: [] as Business[], total: 0 })));
  }

  private setPage(page: { items: Business[]; total: number }): void {
    this.loading = false;
    this.items = page.items;
    this.total = page.total;
  }

  private loadMine(): void {
    if (!this.canAdd) return;
    this.community.myBusinesses().pipe(catchError(() => of([] as Business[]))).subscribe(list => this.mine = list);
  }

  setCategory(c: string): void {
    this.category = this.category === c ? '' : c;
    this.loading = true;
    this.fetch().subscribe(page => this.setPage(page));
  }

  onSearch(): void {
    this.search$.next(this.search.trim());
  }

  loadMore(): void {
    if (this.loadingMore) return;
    this.loadingMore = true;
    this.fetch(this.items.length).subscribe(page => {
      this.loadingMore = false;
      const seen = new Set(this.items.map(b => b.id));
      this.items = [...this.items, ...page.items.filter(b => !seen.has(b.id))];
      this.total = page.total;
    });
  }

  openAdd(): void {
    this.editingId = null;
    this.form = emptyForm();
    this.setFile(null);
    this.showForm = true;
  }

  edit(b: Business): void {
    this.editingId = b.id;
    this.form = {
      name: b.name, category: b.category, description: b.description, city: b.city ?? '', address: b.address ?? '',
      phone: b.phone ?? '', website: b.website ?? '', alumniOffer: b.alumniOffer ?? ''
    };
    this.setFile(null);
    this.preview = null;
    this.showForm = true;
    setTimeout(() => document.querySelector('.cm-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  onFile(event: Event): void {
    this.setFile((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  private setFile(file: File | null): void {
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.file = file;
    this.preview = file ? URL.createObjectURL(file) : null;
  }

  submit(): void {
    const f = this.form;
    if (!f.name.trim() || !f.category.trim()) return this.error('businesses.errRequired');
    if (f.description.trim().length < 10) return this.error('businesses.errDescription');
    if (!f.phone.trim() && !f.website.trim()) return this.error('businesses.errContact');

    this.saving = true;
    this.community.saveBusiness(f, this.file, this.editingId ?? undefined).subscribe({
      next: saved => {
        this.saving = false;
        this.showForm = false;
        this.mine = [saved, ...this.mine.filter(b => b.id !== saved.id)];
        // An edited listing goes back to review — take it off the public grid until approved.
        this.items = this.items.filter(b => b.id !== saved.id);
        this.snackbar.showSuccess(this.lang.translate('businesses.submitted'));
      },
      error: err => {
        this.saving = false;
        this.snackbar.showError(err?.error?.message || this.lang.translate('businesses.saveFailed'));
      }
    });
  }

  remove(b: Business): void {
    this.confirm.askDelete(b.name, this.lang.translate('businesses.deleteConfirm')).subscribe(ok => {
      if (!ok) return;
      this.community.deleteBusiness(b.id).subscribe(() => {
        this.mine = this.mine.filter(x => x.id !== b.id);
        this.items = this.items.filter(x => x.id !== b.id);
      });
    });
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  /** "facebook.com/shop" for display. */
  shortUrl(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
  }

  private error(key: string): void {
    this.snackbar.showError(this.lang.translate(key));
  }
}
