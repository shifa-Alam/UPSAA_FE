import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of } from 'rxjs';
import { ConfirmService } from '../../Services/confirm.service';
import { MAX_QUOTE_LENGTH, Testimonial, TestimonialSave, TestimonialService } from '../../Services/testimonial.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';
import { SizedImagePipe } from '../../Pipes/sized-image.pipe';

const emptyForm = (): TestimonialSave => ({
  fullName: '', batch: null, profession: '', quote: '', isPublished: true, sortOrder: 0
});

/** Back office: the alumni quotes shown in the homepage "Alumni Voices" slider. */
@Component({
  selector: 'app-testimonial-admin',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, FormsModule, MatIconModule, EmptyStateComponent, AdminHeaderComponent, SectionCardComponent, TranslatePipe, SizedImagePipe],
  templateUrl: './testimonial-admin.component.html',
  styleUrl: './testimonial-admin.component.scss'
})
export class TestimonialAdminComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  private service = inject(TestimonialService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);

  readonly maxQuote = MAX_QUOTE_LENGTH;

  items: Testimonial[] = [];
  loading = true;

  form: TestimonialSave = emptyForm();
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  posting = false;

  deletingId: number | null = null;

  editingId: number | null = null;
  editForm: TestimonialSave = emptyForm();
  editFile: File | null = null;
  editPreviewUrl: string | null = null;
  saving = false;

  ngOnInit(): void {
    this.load();
  }

  onFileSelected(event: Event, target: 'new' | 'edit'): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (target === 'new') {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
      this.selectedFile = file;
      this.previewUrl = file ? URL.createObjectURL(file) : null;
    } else {
      if (this.editPreviewUrl) URL.revokeObjectURL(this.editPreviewUrl);
      this.editFile = file;
      this.editPreviewUrl = file ? URL.createObjectURL(file) : null;
    }
  }

  submit(): void {
    if (!this.validate(this.form)) return;

    this.posting = true;
    this.service.create(this.form, this.selectedFile).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.lang.translate('testimonialAdmin.saveFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.posting = false;
      if (!result) return;
      this.snackbar.showSuccess(this.lang.translate('testimonialAdmin.postSuccess'));
      this.resetForm();
      this.load();
    });
  }

  startEdit(t: Testimonial): void {
    this.cancelEdit();
    this.editingId = t.id;
    this.editForm = {
      fullName: t.fullName, batch: t.batch, profession: t.profession ?? '',
      quote: t.quote, isPublished: t.isPublished, sortOrder: t.sortOrder
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    if (this.editPreviewUrl) URL.revokeObjectURL(this.editPreviewUrl);
    this.editPreviewUrl = null;
    this.editFile = null;
  }

  submitEdit(t: Testimonial): void {
    if (!this.validate(this.editForm)) return;

    this.saving = true;
    this.service.update(t.id, this.editForm, this.editFile).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.lang.translate('testimonialAdmin.saveFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;
      this.snackbar.showSuccess(this.lang.translate('testimonialAdmin.editSuccess'));
      this.cancelEdit();
      this.load();
    });
  }

  confirmDelete(t: Testimonial): void {
    this.confirmService.askDelete(t.fullName, this.lang.translate('testimonialAdmin.deleteConfirm')).subscribe(ok => {
      if (!ok) return;
      this.deletingId = t.id;
      this.service.delete(t.id).pipe(finalize(() => this.deletingId = null)).subscribe({
        next: () => {
          this.items = this.items.filter(x => x.id !== t.id);
          this.snackbar.showSuccess(this.lang.translate('testimonialAdmin.deleteSuccess'));
        },
        error: () => this.snackbar.showError(this.lang.translate('testimonialAdmin.deleteFailedError'))
      });
    });
  }

  private validate(f: TestimonialSave): boolean {
    if (!f.fullName.trim()) {
      this.snackbar.showError(this.lang.translate('testimonialAdmin.nameRequiredError'));
      return false;
    }
    if (!f.quote.trim()) {
      this.snackbar.showError(this.lang.translate('testimonialAdmin.quoteRequiredError'));
      return false;
    }
    if (f.quote.trim().length > this.maxQuote) {
      this.snackbar.showError(this.lang.translate('testimonialAdmin.quoteTooLongError'));
      return false;
    }
    return true;
  }

  private resetForm(): void {
    this.form = emptyForm();
    this.selectedFile = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  private load(): void {
    this.service.getAllForAdmin().pipe(catchError(() => of([] as Testimonial[]))).subscribe(items => {
      this.loading = false;
      this.items = items;
    });
  }
}
