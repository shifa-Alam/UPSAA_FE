import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of } from 'rxjs';
import { ConfirmService } from '../../../Services/confirm.service';
import { JobPostService, JobPost, JobPostSave, JobType } from '../../../Services/job-post.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { LanguageService } from '../../../Services/language.service';
import { AuthService } from '../../../Services/auth.service';

const emptyForm = (): JobPostSave => ({
  title: '', companyName: '', location: '', jobType: 'FullTime', description: '', applyInfo: '', deadline: null
});

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, PageHeaderComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss'
})
export class JobsComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  jobTypes: JobType[] = ['FullTime', 'PartTime', 'Internship', 'Contract'];

  jobs: JobPost[] = [];
  loading = true;
  loadError = false;

  showForm = false;
  editMode = false;
  editingId: number | null = null;
  form: JobPostSave = emptyForm();
  saving = false;

  deletingId: number | null = null;

  /** Client-side job-type chip filter; null = all types. */
  typeFilter: JobType | null = null;

  @ViewChild('formEl', { read: ElementRef }) private formEl?: ElementRef<HTMLElement>;

  constructor(
    private jobPostService: JobPostService,
    private snackbar: SnackbarService,
    private languageService: LanguageService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadJobs();
  }

  openAddForm(): void {
    this.editMode = false;
    this.editingId = null;
    this.form = emptyForm();
    this.showForm = true;
    this.revealForm();
  }

  startEdit(job: JobPost): void {
    this.editMode = true;
    this.editingId = job.id;
    this.form = {
      title: job.title,
      companyName: job.companyName,
      location: job.location ?? '',
      jobType: job.jobType,
      description: job.description,
      applyInfo: job.applyInfo,
      deadline: job.deadline ? job.deadline.substring(0, 10) : null
    };
    this.showForm = true;
    this.revealForm();
  }

  cancelForm(): void {
    this.showForm = false;
  }

  submit(): void {
    if (!this.form.title.trim() || !this.form.companyName.trim() || !this.form.description.trim() || !this.form.applyInfo.trim()) {
      this.snackbar.showError(this.languageService.translate('jobs.requiredError'));
      return;
    }

    this.saving = true;
    const request = this.editMode && this.editingId != null
      ? this.jobPostService.update(this.editingId, this.form)
      : this.jobPostService.create(this.form);

    request.pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('jobs.saveFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      if (this.editMode) {
        const index = this.jobs.findIndex(j => j.id === result.id);
        if (index !== -1) this.jobs[index] = result;
        this.snackbar.showSuccess(this.languageService.translate('jobs.editSuccess'));
      } else {
        this.jobs.unshift(result);
        this.typeFilter = null;
        this.snackbar.showSuccess(this.languageService.translate('jobs.postSuccess'));
      }

      this.showForm = false;
    });
  }

  confirmDelete(job: JobPost): void {
    this.confirmService.askDelete(job.title, this.languageService.translate('jobs.deleteConfirm')).subscribe(ok => {
      if (!ok) return;

      this.deletingId = job.id;
      this.jobPostService.delete(job.id).pipe(finalize(() => this.deletingId = null)).subscribe({
        next: () => {
          this.jobs = this.jobs.filter(j => j.id !== job.id);
          this.snackbar.showSuccess(this.languageService.translate('jobs.deleteSuccess'));
        },
        error: () => this.snackbar.showError(this.languageService.translate('jobs.deleteFailedError'))
      });
    });
  }

  get visibleJobs(): JobPost[] {
    return this.typeFilter ? this.jobs.filter(j => j.jobType === this.typeFilter) : this.jobs;
  }

  private get locale(): string {
    return this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  num(value: number): string {
    return new Intl.NumberFormat(this.locale).format(value);
  }

  date(value: string): string {
    return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }

  initial(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  jobTypeLabelKey(type: JobType): string {
    return 'jobs.type' + type;
  }

  isExpired(job: JobPost): boolean {
    return !!job.deadline && new Date(job.deadline) < new Date();
  }

  /** The form renders above the list, so bring it into view when editing a card further down. */
  private revealForm(): void {
    setTimeout(() => {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this.formEl?.nativeElement.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  private loadJobs(): void {
    this.loading = true;
    this.jobPostService.getAll().pipe(catchError(() => of(null))).subscribe(jobs => {
      this.loading = false;
      if (!jobs) {
        this.loadError = true;
        return;
      }
      this.jobs = jobs;
    });
  }
}
