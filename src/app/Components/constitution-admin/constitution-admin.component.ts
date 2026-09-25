import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { ConfirmService } from '../../Services/confirm.service';
import { ConstitutionService, ConstitutionDocument } from '../../Services/constitution.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { LanguageService } from '../../Services/language.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';

const MAX_FILE_MB = 20;

/** SuperAdmin/Admin: upload, replace or remove the constitution PDF members read at /portal/constitution. */
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-constitution-admin',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, MatIconModule, AdminHeaderComponent, SectionCardComponent, TranslatePipe],
  templateUrl: './constitution-admin.component.html',
  styleUrl: './constitution-admin.component.scss'
})
export class ConstitutionAdminComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  current: ConstitutionDocument | null = null;
  loading = true;
  /** GetCurrent failed for some other reason (network, 5xx) — uploading may still work. */
  loadFailed = false;
  /** The server answered 404: it has no /Constitution endpoints yet, so uploads can't work. */
  apiMissing = false;

  selectedFile: File | null = null;
  uploading = false;
  deleting = false;
  readonly maxFileMb = MAX_FILE_MB;

  constructor(
    private constitutionService: ConstitutionService,
    private snackbar: SnackbarService,
    private lang: LanguageService
  ) { }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.constitutionService.getCurrent().pipe(finalize(() => this.loading = false)).subscribe({
      next: doc => {
        this.loadFailed = false;
        this.apiMissing = false;
        this.current = doc?.fileUrl ? doc : null;
      },
      error: err => {
        this.apiMissing = err?.status === 404;
        this.loadFailed = !this.apiMissing;
        this.current = null;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = ''; // let the same file be picked again after a failed upload

    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.snackbar.showError(this.lang.translate('constitutionAdmin.pdfOnlyError'));
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      this.snackbar.showError(this.lang.translate('constitutionAdmin.tooLargeError'));
      return;
    }
    this.selectedFile = file;
  }

  clearSelection(): void {
    this.selectedFile = null;
  }

  upload(): void {
    if (!this.selectedFile || this.uploading || this.apiMissing) return;
    this.uploading = true;
    this.constitutionService.upload(this.selectedFile).pipe(finalize(() => this.uploading = false)).subscribe({
      next: doc => {
        this.current = doc;
        this.selectedFile = null;
        this.loadFailed = false;
        this.snackbar.showSuccess(this.lang.translate('constitutionAdmin.uploadSuccess'));
      },
      error: err => {
        if (err?.status === 404) {
          this.apiMissing = true;
          this.snackbar.showError(this.lang.translate('constitutionAdmin.apiMissingError'));
          return;
        }
        this.snackbar.showError(err?.error?.message || this.lang.translate('constitutionAdmin.uploadFailedError'));
      }
    });
  }

  view(): void {
    if (!this.current) return;
    this.constitutionService.open(this.current, 'view', () =>
      this.snackbar.showError(this.lang.translate('constitution.document.openFailed')));
  }

  remove(): void {
    if (!this.current || this.deleting) return;
    this.confirmService.ask({ message: this.lang.translate('constitutionAdmin.deleteConfirm'), danger: true }).subscribe(ok => {
      if (!ok) return;
      this.deleting = true;
      this.constitutionService.delete().pipe(finalize(() => this.deleting = false)).subscribe({
        next: () => {
          this.current = null;
          this.snackbar.showSuccess(this.lang.translate('constitutionAdmin.deleteSuccess'));
        },
        error: err => {
          this.snackbar.showError(err?.error?.message || this.lang.translate('constitutionAdmin.deleteFailedError'));
        }
      });
    });
  }

  formatSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(mb < 0.1 ? 0.1 : mb) + ' MB';
  }

  uploadedOn(doc: ConstitutionDocument): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
      .format(new Date(doc.uploadedAt));
  }
}
