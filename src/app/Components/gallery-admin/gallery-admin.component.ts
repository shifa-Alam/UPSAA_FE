import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of } from 'rxjs';
import { ConfirmService } from '../../Services/confirm.service';
import {
  GalleryService, GalleryImage, GALLERY_MAX_FILE_BYTES, GALLERY_MAX_FILES_PER_UPLOAD
} from '../../Services/gallery.service';
import { EventService, EventItem } from '../../Services/event.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';

@Component({
  selector: 'app-gallery-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, EmptyStateComponent, AdminHeaderComponent, SectionCardComponent, TranslatePipe],
  templateUrl: './gallery-admin.component.html',
  styleUrl: './gallery-admin.component.scss'
})
export class GalleryAdminComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  images: GalleryImage[] = [];
  categories: string[] = [];
  loading = true;

  events: EventItem[] = [];

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  title = '';
  category = '';
  eventId: number | null = null;
  uploading = false;
  dragging = false;
  readonly maxFiles = GALLERY_MAX_FILES_PER_UPLOAD;

  deletingId: number | null = null;

  editingId: number | null = null;
  editTitle = '';
  editCategory = '';
  editEventId: number | null = null;
  editFile: File | null = null;
  editPreviewUrl: string | null = null;
  saving = false;

  /** Client-side category filter for the grid (null = all categories). */
  activeCategory: string | null = null;

  constructor(
    private galleryService: GalleryService,
    private eventService: EventService,
    private snackbar: SnackbarService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadImages();
    this.loadCategories();
    this.eventService.getAll().pipe(catchError(() => of([]))).subscribe(events => {
      this.events = [...events].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    });
  }

  /** Picking an event pre-fills an empty title with the event's name. */
  onEventChange(): void {
    const ev = this.events.find(e => e.id === this.eventId);
    if (ev && !this.title.trim()) this.title = ev.title;
  }

  eventOptionLabel(ev: EventItem): string {
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ev.eventDate));
    return `${ev.title} — ${date}`;
  }

  /** Distinct categories present among the loaded images, in first-seen order. */
  get imageCategories(): string[] {
    const seen = new Set<string>();
    for (const image of this.images) {
      if (image.category) seen.add(image.category);
    }
    return Array.from(seen);
  }

  /** Images shown in the grid — falls back to all when the active category no longer exists. */
  get visibleImages(): GalleryImage[] {
    const active = this.activeCategory;
    if (!active || !this.images.some(i => i.category === active)) return this.images;
    return this.images.filter(i => i.category === active);
  }

  isCategoryActive(category: string | null): boolean {
    const active = this.activeCategory && this.images.some(i => i.category === this.activeCategory)
      ? this.activeCategory : null;
    return active === category;
  }

  setCategory(category: string | null): void {
    this.activeCategory = category;
  }

  countFor(category: string): number {
    return this.images.filter(i => i.category === category).length;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(input.files ? Array.from(input.files) : []);
    // Reset so choosing the same file again (after removing it) still fires change.
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.dragging = true;
  }

  onDragLeave(event: DragEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (event.currentTarget as HTMLElement).contains(next)) return;
    this.dragging = false;
  }

  onDrop(event: DragEvent): void {
    // Also cancels the file input's own drop handling, which would replace the selection.
    event.preventDefault();
    this.dragging = false;
    this.addFiles(event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : []);
  }

  /** Adds to the current selection, skipping non-images, oversized files, duplicates and anything past the limit. */
  private addFiles(incoming: File[]): void {
    if (incoming.length === 0) return;

    const t = (k: string) => this.languageService.translate(`galleryAdmin.${k}`);
    const key = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
    const existing = new Set(this.selectedFiles.map(key));
    const accepted: File[] = [];
    const notImages: string[] = [];
    const tooLarge: string[] = [];
    let overLimit = 0;

    for (const file of incoming) {
      if (!file.type.startsWith('image/')) { notImages.push(file.name); continue; }
      if (file.size > GALLERY_MAX_FILE_BYTES) { tooLarge.push(file.name); continue; }
      if (existing.has(key(file))) continue;
      if (this.selectedFiles.length + accepted.length >= this.maxFiles) { overLimit++; continue; }
      existing.add(key(file));
      accepted.push(file);
    }

    const problems = [
      tooLarge.length ? `${t('tooLargeError')}: ${tooLarge.join(', ')}` : '',
      notImages.length ? `${t('notImageError')}: ${notImages.join(', ')}` : '',
      overLimit ? t('tooManyError').replace('{max}', String(this.maxFiles)) : ''
    ].filter(Boolean);
    if (problems.length) this.snackbar.showError(problems.join(' · '));

    if (accepted.length) this.setSelectedFiles([...this.selectedFiles, ...accepted]);
  }

  get totalSizeLabel(): string {
    const bytes = this.selectedFiles.reduce((sum, f) => sum + f.size, 0);
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  removeSelectedFile(index: number): void {
    const files = this.selectedFiles.slice();
    files.splice(index, 1);
    this.setSelectedFiles(files);
  }

  private setSelectedFiles(files: File[]): void {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.selectedFiles = files;
    this.previewUrls = files.map(f => URL.createObjectURL(f));
  }

  get selectedCountLabel(): string {
    return this.languageService.translate('galleryAdmin.selectedCount').replace('{count}', String(this.selectedFiles.length));
  }

  submit(): void {
    if (this.selectedFiles.length === 0) {
      this.snackbar.showError(this.languageService.translate('galleryAdmin.selectImageError'));
      return;
    }
    if (!this.title.trim()) {
      this.snackbar.showError(this.languageService.translate('galleryAdmin.titleRequiredError'));
      return;
    }
    if (!this.category.trim()) {
      this.snackbar.showError(this.languageService.translate('galleryAdmin.categoryRequiredError'));
      return;
    }

    this.uploading = true;
    this.galleryService.uploadMultiple(this.selectedFiles, this.title.trim(), this.category.trim(), this.eventId).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('galleryAdmin.uploadFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.uploading = false;
      if (!result) return;

      this.snackbar.showSuccess(result.length > 1
        ? this.languageService.translate('galleryAdmin.uploadMultipleSuccess').replace('{count}', String(result.length))
        : this.languageService.translate('galleryAdmin.uploadSuccess'));
      this.resetForm();
      this.loadImages();
      this.loadCategories();
    });
  }

  startEdit(image: GalleryImage): void {
    this.editingId = image.id;
    this.editTitle = image.title;
    this.editCategory = image.category;
    this.editEventId = image.eventId;
    this.editFile = null;
    this.editPreviewUrl = null;
  }

  cancelEdit(): void {
    this.editingId = null;
    if (this.editPreviewUrl) URL.revokeObjectURL(this.editPreviewUrl);
    this.editPreviewUrl = null;
    this.editFile = null;
  }

  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.size > GALLERY_MAX_FILE_BYTES) {
      this.snackbar.showError(`${this.languageService.translate('galleryAdmin.tooLargeError')}: ${file.name}`);
      input.value = '';
      return;
    }
    this.editFile = file;

    if (this.editPreviewUrl) {
      URL.revokeObjectURL(this.editPreviewUrl);
    }
    this.editPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  submitEdit(image: GalleryImage): void {
    if (!this.editTitle.trim()) {
      this.snackbar.showError(this.languageService.translate('galleryAdmin.titleRequiredError'));
      return;
    }
    if (!this.editCategory.trim()) {
      this.snackbar.showError(this.languageService.translate('galleryAdmin.categoryRequiredError'));
      return;
    }

    this.saving = true;
    this.galleryService.update(image.id, this.editTitle.trim(), this.editCategory.trim(), this.editEventId, this.editFile).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('galleryAdmin.editFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      const index = this.images.findIndex(i => i.id === image.id);
      if (index !== -1) this.images[index] = result;

      this.snackbar.showSuccess(this.languageService.translate('galleryAdmin.editSuccess'));
      this.cancelEdit();
      this.loadCategories();
    });
  }

  confirmDelete(image: GalleryImage): void {
    this.confirmService.askDelete(image.title, this.languageService.translate('galleryAdmin.deleteConfirm')).subscribe(ok => {
      if (!ok) return;

      this.deletingId = image.id;
      this.galleryService.delete(image.id).pipe(finalize(() => this.deletingId = null)).subscribe({
        next: () => {
          this.images = this.images.filter(i => i.id !== image.id);
          this.snackbar.showSuccess(this.languageService.translate('galleryAdmin.deleteSuccess'));
        },
        error: () => this.snackbar.showError(this.languageService.translate('galleryAdmin.deleteFailedError'))
      });
    });
  }

  private resetForm(): void {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.selectedFiles = [];
    this.previewUrls = [];
    this.title = '';
    this.category = '';
    this.eventId = null;
  }

  private loadImages(): void {
    this.loading = true;
    this.galleryService.getAll().pipe(catchError(() => of([]))).subscribe(images => {
      this.loading = false;
      this.images = images;
    });
  }

  private loadCategories(): void {
    this.galleryService.getCategories().pipe(catchError(() => of([]))).subscribe(cats => {
      this.categories = cats;
    });
  }
}
