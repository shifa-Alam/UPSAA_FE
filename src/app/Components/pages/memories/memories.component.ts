import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CommunityService, Memory } from '../../../Services/community.service';
import { AuthService } from '../../../Services/auth.service';
import { ConfirmService } from '../../../Services/confirm.service';
import { LanguageService } from '../../../Services/language.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

const PAGE = 12;
export const MAX_STORY = 1000;

/**
 * The memory wall (/memories, /portal/memories): school-days photos and stories shared by
 * alumni, published after staff approval, answered with "মনে আছে!".
 */
@Component({
  selector: 'app-memories',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TranslatePipe, SizedImagePipe, SizedSrcsetPipe,
    PageHeaderComponent, EmptyStateComponent, SkeletonComponent, RevealDirective],
  templateUrl: './memories.component.html',
  styleUrl: './memories.component.scss'
})
export class MemoriesComponent implements OnInit, OnDestroy {
  private community = inject(CommunityService);
  private confirm = inject(ConfirmService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);
  auth = inject(AuthService);

  readonly maxStory = MAX_STORY;

  memories: Memory[] = [];
  total = 0;
  loading = true;
  loadingMore = false;
  mine: Memory[] = [];
  /** Cards whose full story is showing. */
  expanded = new Set<number>();

  showForm = false;
  story = '';
  year: number | null = null;
  file: File | null = null;
  preview: string | null = null;
  saving = false;
  busyId: number | null = null;

  ngOnInit(): void {
    this.community.memories({ take: PAGE }).pipe(catchError(() => of({ items: [] as Memory[], total: 0 }))).subscribe(page => {
      this.loading = false;
      this.memories = page.items;
      this.total = page.total;
    });
    this.loadMine();
  }

  ngOnDestroy(): void {
    if (this.preview) URL.revokeObjectURL(this.preview);
  }

  get canShare(): boolean {
    return this.auth.isLoggedIn() && this.auth.hasMemberRecord();
  }

  private loadMine(): void {
    if (!this.canShare) return;
    this.community.myMemories().pipe(catchError(() => of([] as Memory[]))).subscribe(list => this.mine = list.filter(m => m.status !== 'Approved'));
  }

  loadMore(): void {
    if (this.loadingMore) return;
    this.loadingMore = true;
    this.community.memories({ skip: this.memories.length, take: PAGE }).pipe(catchError(() => of(null))).subscribe(page => {
      this.loadingMore = false;
      if (!page) return;
      const seen = new Set(this.memories.map(m => m.id));
      this.memories = [...this.memories, ...page.items.filter(m => !seen.has(m.id))];
      this.total = page.total;
    });
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.file = file;
    this.preview = file ? URL.createObjectURL(file) : null;
  }

  submit(): void {
    if (this.story.trim().length < 10) {
      this.snackbar.showError(this.lang.translate('memories.errStory'));
      return;
    }
    this.saving = true;
    this.community.shareMemory(this.story.trim(), this.year || null, this.file).subscribe({
      next: m => {
        this.saving = false;
        this.showForm = false;
        this.story = '';
        this.year = null;
        this.onFile({ target: { files: null } } as unknown as Event);
        this.mine = [m, ...this.mine];
        this.snackbar.showSuccess(this.lang.translate('memories.submitted'));
      },
      error: err => {
        this.saving = false;
        this.snackbar.showError(err?.error?.message || this.lang.translate('memories.saveFailed'));
      }
    });
  }

  remember(m: Memory): void {
    if (!this.canShare) {
      this.snackbar.showError(this.lang.translate('memories.loginToRemember'));
      return;
    }
    this.busyId = m.id;
    this.community.remember(m.id).subscribe({
      next: res => {
        this.busyId = null;
        m.iRemember = res.remembered;
        m.rememberCount = res.count;
      },
      error: () => this.busyId = null
    });
  }

  remove(m: Memory): void {
    this.confirm.askDelete('', this.lang.translate('memories.deleteConfirm')).subscribe(ok => {
      if (!ok) return;
      this.community.deleteMemory(m.id).subscribe(() => {
        this.memories = this.memories.filter(x => x.id !== m.id);
        this.mine = this.mine.filter(x => x.id !== m.id);
      });
    });
  }

  isLong(m: Memory): boolean {
    return m.story.length > 280;
  }

  toggle(m: Memory): void {
    if (this.expanded.has(m.id)) this.expanded.delete(m.id); else this.expanded.add(m.id);
  }

  private get locale(): string {
    return this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  num(n: number, plain = false): string {
    return new Intl.NumberFormat(this.locale, { useGrouping: !plain }).format(n);
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
