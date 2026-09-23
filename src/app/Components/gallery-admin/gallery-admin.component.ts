import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { GalleryService, GalleryImage } from '../../Services/gallery.service';
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
  images: GalleryImage[] = [];
  categories: string[] = [];
  loading = true;

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  title = '';
  category = '';
  uploading = false;

  deletingId: number | null = null;

  editingId: number | null = null;
  editTitle = '';
  editCategory = '';
  editFile: File | null = null;
  editPreviewUrl: string | null = null;
  saving = false;

  /** Client-side category filter for the grid (null = all categories). */
  activeCategory: string | null = null;

  constructor(private galleryService: GalleryService, private snackbar: SnackbarService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.loadImages();
    this.loadCategories();
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
    const files = input.files ? Array.from(input.files) : [];
    this.setSelectedFiles(files);
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
    this.galleryService.uploadMultiple(this.selectedFiles, this.title.trim(), this.category.trim()).pipe(
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
    this.galleryService.update(image.id, this.editTitle.trim(), this.editCategory.trim(), this.editFile).pipe(
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
    if (!confirm(`"${image.title}" ${this.languageService.translate('galleryAdmin.deleteConfirm')}`)) return;

    this.deletingId = image.id;
    this.galleryService.delete(image.id).pipe(
      catchError(() => {
        this.snackbar.showError(this.languageService.translate('galleryAdmin.deleteFailedError'));
        return of(null);
      })
    ).subscribe(() => {
      this.deletingId = null;
      this.images = this.images.filter(i => i.id !== image.id);
      this.snackbar.showSuccess(this.languageService.translate('galleryAdmin.deleteSuccess'));
    });
  }

  private resetForm(): void {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.selectedFiles = [];
    this.previewUrls = [];
    this.title = '';
    this.category = '';
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
