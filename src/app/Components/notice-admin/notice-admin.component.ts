import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of } from 'rxjs';
import { ConfirmService } from '../../Services/confirm.service';
import { NoticeService, Notice } from '../../Services/notice.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';

@Component({
  selector: 'app-notice-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, EmptyStateComponent, AdminHeaderComponent, SectionCardComponent, TranslatePipe],
  templateUrl: './notice-admin.component.html',
  styleUrl: './notice-admin.component.scss'
})
export class NoticeAdminComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  notices: Notice[] = [];
  loading = true;

  title = '';
  content = '';
  publishedDate = this.formatDateTime(new Date());
  alumniOnly = false;
  posting = false;

  editingId: number | null = null;
  editTitle = '';
  editContent = '';
  editPublishedDate = '';
  editAlumniOnly = false;
  saving = false;

  deletingId: number | null = null;

  constructor(private noticeService: NoticeService, private snackbar: SnackbarService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.loadNotices();
  }

  submit(): void {
    if (!this.title.trim()) {
      this.snackbar.showError(this.languageService.translate('noticeAdmin.titleRequiredError'));
      return;
    }
    if (!this.content.trim()) {
      this.snackbar.showError(this.languageService.translate('noticeAdmin.contentRequiredError'));
      return;
    }

    this.posting = true;
    this.noticeService.create(this.title.trim(), this.content.trim(), this.publishedDate || null, this.alumniOnly).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('noticeAdmin.postFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.posting = false;
      if (!result) return;

      this.snackbar.showSuccess(this.languageService.translate('noticeAdmin.postSuccess'));
      this.title = '';
      this.content = '';
      this.publishedDate = this.formatDateTime(new Date());
      this.alumniOnly = false;
      this.notices.unshift(result);
      this.notices.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    });
  }

  startEdit(notice: Notice): void {
    this.editingId = notice.id;
    this.editTitle = notice.title;
    this.editContent = notice.content;
    this.editPublishedDate = this.formatDateTime(notice.publishedDate);
    this.editAlumniOnly = notice.alumniOnly;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  submitEdit(notice: Notice): void {
    if (!this.editTitle.trim()) {
      this.snackbar.showError(this.languageService.translate('noticeAdmin.titleRequiredError'));
      return;
    }
    if (!this.editContent.trim()) {
      this.snackbar.showError(this.languageService.translate('noticeAdmin.contentRequiredError'));
      return;
    }

    this.saving = true;
    this.noticeService.update(notice.id, this.editTitle.trim(), this.editContent.trim(), this.editPublishedDate || null, this.editAlumniOnly).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('noticeAdmin.editFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      const index = this.notices.findIndex(n => n.id === notice.id);
      if (index !== -1) this.notices[index] = result;
      this.notices.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

      this.snackbar.showSuccess(this.languageService.translate('noticeAdmin.editSuccess'));
      this.cancelEdit();
    });
  }

  private formatDateTime(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    const hours = ('0' + d.getHours()).slice(-2);
    const minutes = ('0' + d.getMinutes()).slice(-2);
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  confirmDelete(notice: Notice): void {
    this.confirmService.askDelete(notice.title, this.languageService.translate('noticeAdmin.deleteConfirm')).subscribe(ok => {
      if (!ok) return;

      this.deletingId = notice.id;
      this.noticeService.delete(notice.id).pipe(finalize(() => this.deletingId = null)).subscribe({
        next: () => {
          this.notices = this.notices.filter(n => n.id !== notice.id);
          this.snackbar.showSuccess(this.languageService.translate('noticeAdmin.deleteSuccess'));
        },
        error: () => this.snackbar.showError(this.languageService.translate('noticeAdmin.deleteFailedError'))
      });
    });
  }

  private loadNotices(): void {
    this.loading = true;
    this.noticeService.getAll().pipe(catchError(() => of([]))).subscribe(notices => {
      this.loading = false;
      this.notices = notices;
    });
  }
}
