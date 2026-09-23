import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { AchievementService, Achievement, AchievementSave } from '../../Services/achievement.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';

const emptyForm = (): AchievementSave => ({
  fullName: '', batch: null, profession: '', organization: '', title: '', description: ''
});

@Component({
  selector: 'app-achievement-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, EmptyStateComponent, AdminHeaderComponent, SectionCardComponent, TranslatePipe],
  templateUrl: './achievement-admin.component.html',
  styleUrl: './achievement-admin.component.scss'
})
export class AchievementAdminComponent implements OnInit {
  achievements: Achievement[] = [];
  loading = true;

  form: AchievementSave = emptyForm();
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  posting = false;

  deletingId: number | null = null;

  editingId: number | null = null;
  editForm: AchievementSave = emptyForm();
  editFile: File | null = null;
  editPreviewUrl: string | null = null;
  saving = false;

  constructor(
    private achievementService: AchievementService,
    private snackbar: SnackbarService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadAchievements();
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
      this.snackbar.showError(this.languageService.translate('achievementAdmin.nameRequiredError'));
      return;
    }
    if (!this.form.title.trim()) {
      this.snackbar.showError(this.languageService.translate('achievementAdmin.achievementTitleRequiredError'));
      return;
    }

    this.posting = true;
    this.achievementService.create(this.form, this.selectedFile).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('achievementAdmin.postFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.posting = false;
      if (!result) return;

      this.snackbar.showSuccess(this.languageService.translate('achievementAdmin.postSuccess'));
      this.resetForm();
      this.achievements.unshift(result);
    });
  }

  startEdit(achievement: Achievement): void {
    this.editingId = achievement.id;
    this.editForm = {
      fullName: achievement.fullName,
      batch: achievement.batch,
      profession: achievement.profession ?? '',
      organization: achievement.organization ?? '',
      title: achievement.title,
      description: achievement.description ?? ''
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

  submitEdit(achievement: Achievement): void {
    if (!this.editForm.fullName.trim()) {
      this.snackbar.showError(this.languageService.translate('achievementAdmin.nameRequiredError'));
      return;
    }
    if (!this.editForm.title.trim()) {
      this.snackbar.showError(this.languageService.translate('achievementAdmin.achievementTitleRequiredError'));
      return;
    }

    this.saving = true;
    this.achievementService.update(achievement.id, this.editForm, this.editFile).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('achievementAdmin.editFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      const index = this.achievements.findIndex(a => a.id === achievement.id);
      if (index !== -1) this.achievements[index] = result;

      this.snackbar.showSuccess(this.languageService.translate('achievementAdmin.editSuccess'));
      this.cancelEdit();
    });
  }

  confirmDelete(achievement: Achievement): void {
    if (!confirm(`"${achievement.title}" ${this.languageService.translate('achievementAdmin.deleteConfirm')}`)) return;

    this.deletingId = achievement.id;
    this.achievementService.delete(achievement.id).pipe(
      catchError(() => {
        this.snackbar.showError(this.languageService.translate('achievementAdmin.deleteFailedError'));
        return of(null);
      })
    ).subscribe(() => {
      this.deletingId = null;
      this.achievements = this.achievements.filter(a => a.id !== achievement.id);
      this.snackbar.showSuccess(this.languageService.translate('achievementAdmin.deleteSuccess'));
    });
  }

  private resetForm(): void {
    this.form = emptyForm();
    this.selectedFile = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  private loadAchievements(): void {
    this.loading = true;
    this.achievementService.getAll().pipe(catchError(() => of([]))).subscribe(achievements => {
      this.loading = false;
      this.achievements = achievements;
    });
  }
}
