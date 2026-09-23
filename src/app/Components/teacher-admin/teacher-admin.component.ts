import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { TeacherService, Teacher, TeacherSave, TeacherStatus } from '../../Services/teacher.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';

const emptyForm = (): TeacherSave => ({
  fullName: '', designation: '', subject: '', status: 'Current', serviceStartYear: null, serviceEndYear: null, message: ''
});

@Component({
  selector: 'app-teacher-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, EmptyStateComponent, AdminHeaderComponent, SectionCardComponent, TranslatePipe],
  templateUrl: './teacher-admin.component.html',
  styleUrl: './teacher-admin.component.scss'
})
export class TeacherAdminComponent implements OnInit {
  statuses: TeacherStatus[] = ['Current', 'Former', 'Retired'];

  teachers: Teacher[] = [];
  loading = true;

  form: TeacherSave = emptyForm();
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  posting = false;

  deletingId: number | null = null;

  editingId: number | null = null;
  editForm: TeacherSave = emptyForm();
  editFile: File | null = null;
  editPreviewUrl: string | null = null;
  saving = false;

  constructor(
    private teacherService: TeacherService,
    private snackbar: SnackbarService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadTeachers();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;

    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = file ? URL.createObjectURL(file) : null;
  }

  submit(): void {
    if (!this.form.fullName.trim()) {
      this.snackbar.showError(this.languageService.translate('teacherAdmin.nameRequiredError'));
      return;
    }

    this.posting = true;
    this.teacherService.create(this.form, this.selectedFile).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('teacherAdmin.postFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.posting = false;
      if (!result) return;

      this.snackbar.showSuccess(this.languageService.translate('teacherAdmin.postSuccess'));
      this.resetForm();
      this.teachers.unshift(result);
    });
  }

  startEdit(teacher: Teacher): void {
    this.editingId = teacher.id;
    this.editForm = {
      fullName: teacher.fullName,
      designation: teacher.designation ?? '',
      subject: teacher.subject ?? '',
      status: teacher.status,
      serviceStartYear: teacher.serviceStartYear,
      serviceEndYear: teacher.serviceEndYear,
      message: teacher.message ?? ''
    };
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

    if (this.editPreviewUrl) URL.revokeObjectURL(this.editPreviewUrl);
    this.editPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  submitEdit(teacher: Teacher): void {
    if (!this.editForm.fullName.trim()) {
      this.snackbar.showError(this.languageService.translate('teacherAdmin.nameRequiredError'));
      return;
    }

    this.saving = true;
    this.teacherService.update(teacher.id, this.editForm, this.editFile).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('teacherAdmin.editFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      const index = this.teachers.findIndex(t => t.id === teacher.id);
      if (index !== -1) this.teachers[index] = result;

      this.snackbar.showSuccess(this.languageService.translate('teacherAdmin.editSuccess'));
      this.cancelEdit();
    });
  }

  confirmDelete(teacher: Teacher): void {
    if (!confirm(`"${teacher.fullName}" ${this.languageService.translate('teacherAdmin.deleteConfirm')}`)) return;

    this.deletingId = teacher.id;
    this.teacherService.delete(teacher.id).pipe(
      catchError(() => {
        this.snackbar.showError(this.languageService.translate('teacherAdmin.deleteFailedError'));
        return of(null);
      })
    ).subscribe(() => {
      this.deletingId = null;
      this.teachers = this.teachers.filter(t => t.id !== teacher.id);
      this.snackbar.showSuccess(this.languageService.translate('teacherAdmin.deleteSuccess'));
    });
  }

  statusLabelKey(status: TeacherStatus): string {
    return 'teacherAdmin.status' + status;
  }

  private resetForm(): void {
    this.form = emptyForm();
    this.selectedFile = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  private loadTeachers(): void {
    this.loading = true;
    this.teacherService.getAll().pipe(catchError(() => of([]))).subscribe(teachers => {
      this.loading = false;
      this.teachers = teachers;
    });
  }
}
