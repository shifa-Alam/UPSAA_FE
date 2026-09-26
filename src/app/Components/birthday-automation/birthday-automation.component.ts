import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import {
  BirthdayPostService,
  FacebookSettings,
  BirthdayMember,
  BirthdayPostLog
} from '../../Services/birthday-post.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';
import { SizedImagePipe, SizedSrcsetPipe } from '../../Pipes/sized-image.pipe';

import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-birthday-automation',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, FormsModule, MatIconModule, EmptyStateComponent, AdminHeaderComponent, SectionCardComponent, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './birthday-automation.component.html',
  styleUrl: './birthday-automation.component.scss'
})
export class BirthdayAutomationComponent implements OnInit, OnDestroy {
  settings: FacebookSettings | null = null;
  settingsLoading = true;
  saving = false;

  enabled = false;
  emailEnabled = false;
  pageId = '';
  pageAccessToken = '';
  postTime = '09:00';

  // Birthday email wording (keep limits in sync with BirthdayEmailTemplate on the server).
  emailSubject = '';
  emailBody = '';
  readonly maxSubjectLength = 300;
  readonly maxBodyLength = 5000;
  readonly placeholders = [
    { token: '{name}', labelKey: 'birthdayAutomation.phName' },
    { token: '{batch}', labelKey: 'birthdayAutomation.phBatch' },
    { token: '{position}', labelKey: 'birthdayAutomation.phPosition' },
    { token: '{card}', labelKey: 'birthdayAutomation.phCard' },
  ];

  /** Card preview overlay. */
  preview: { member: BirthdayMember; url: string | null } | null = null;
  sendingEmailId: number | null = null;

  birthdays: BirthdayMember[] = [];
  birthdaysLoading = true;

  logs: BirthdayPostLog[] = [];
  logsLoading = true;

  runningNow = false;

  constructor(
    private birthdayPostService: BirthdayPostService,
    private snackbar: SnackbarService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadSettings();
    this.loadBirthdays();
    this.loadLogs();
  }

  saveSettings(): void {
    if (this.enabled && !this.pageId.trim()) {
      this.snackbar.showError(this.languageService.translate('birthdayAutomation.pageIdRequiredError'));
      return;
    }
    if (this.emailSubject.length > this.maxSubjectLength || this.emailBody.length > this.maxBodyLength) {
      this.snackbar.showError(this.languageService.translate('birthdayAutomation.emailTooLongError'));
      return;
    }

    this.saving = true;
    this.birthdayPostService.updateSettings({
      enabled: this.enabled,
      pageId: this.pageId.trim() || null,
      pageAccessToken: this.pageAccessToken.trim() || null,
      postTime: this.postTime,
      emailEnabled: this.emailEnabled,
      emailSubject: this.emailSubject,
      emailBody: this.emailBody
    }).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('birthdayAutomation.saveFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      this.applySettings(result);
      this.pageAccessToken = '';
      this.snackbar.showSuccess(this.languageService.translate('birthdayAutomation.saveSuccess'));
    });
  }

  /** Insert a placeholder at the cursor of the subject input or body textarea. */
  insertPlaceholder(token: string, field: HTMLInputElement | HTMLTextAreaElement, target: 'subject' | 'body'): void {
    const value = target === 'subject' ? this.emailSubject : this.emailBody;
    const start = field.selectionStart ?? value.length;
    const end = field.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    if (target === 'subject') this.emailSubject = next; else this.emailBody = next;
    setTimeout(() => {
      field.focus();
      field.setSelectionRange(start + token.length, start + token.length);
    });
  }

  resetEmailWording(): void {
    if (!this.settings) return;
    this.emailSubject = this.settings.defaultEmailSubject;
    this.emailBody = this.settings.defaultEmailBody;
  }

  get emailWordingIsDefault(): boolean {
    return !!this.settings
      && this.emailSubject.trim() === this.settings.defaultEmailSubject
      && this.emailBody.replace(/\r\n/g, '\n').trim() === this.settings.defaultEmailBody;
  }

  /** Sample member for the live preview — today's first birthday, or a stand-in. */
  private get previewValues(): { name: string; batch: string; position: string } {
    const m = this.birthdays[0];
    return {
      name: m?.fullName ?? this.languageService.translate('birthdayAutomation.sampleName'),
      batch: String(m?.batch ?? 2012),
      position: this.languageService.translate('birthdayAutomation.samplePosition')
    };
  }

  private fill(text: string): string {
    const v = this.previewValues;
    return text.replace(/\{name\}/g, v.name).replace(/\{batch\}/g, v.batch).replace(/\{position\}/g, v.position);
  }

  get previewSubject(): string {
    const subject = this.emailSubject.trim() || this.settings?.defaultEmailSubject || '';
    return this.fill(subject).replace(/\{card\}/g, '').replace(/\s+/g, ' ').trim();
  }

  /** Body split into paragraphs; `card` marks where the photo card goes (end if not placed). */
  get previewBlocks(): { card: boolean; text: string }[] {
    let body = (this.emailBody.trim() || this.settings?.defaultEmailBody || '').replace(/\r\n/g, '\n');
    if (!body.includes('{card}')) body += '\n\n{card}';
    const blocks: { card: boolean; text: string }[] = [];
    for (const paragraph of body.split(/\n\s*\n/)) {
      const parts = paragraph.trim().split('{card}');
      parts.forEach((part, i) => {
        if (part.trim()) blocks.push({ card: false, text: this.fill(part.trim()) });
        if (i < parts.length - 1) blocks.push({ card: true, text: '' });
      });
    }
    return blocks;
  }

  runNow(): void {
    this.runningNow = true;
    this.birthdayPostService.runNow().pipe(
      catchError(() => {
        this.snackbar.showError(this.languageService.translate('birthdayAutomation.runFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.runningNow = false;
      if (!result) return;

      this.snackbar.showSuccess(
        this.languageService.translate('birthdayAutomation.runSuccess')
          .replace('{count}', String(result.processed))
          .replace('{emailed}', String(result.emailed ?? 0))
      );
      this.loadBirthdays();
      this.loadLogs();
    });
  }

  openPreview(member: BirthdayMember): void {
    this.closePreview();
    this.preview = { member, url: null };
    this.birthdayPostService.getCard(member.memberId).pipe(catchError(() => of(null))).subscribe(blob => {
      if (!this.preview || this.preview.member !== member) return;
      if (!blob) {
        this.snackbar.showError(this.languageService.translate('birthdayAutomation.cardFailedError'));
        this.closePreview();
        return;
      }
      this.preview.url = URL.createObjectURL(blob);
    });
  }

  @HostListener('document:keydown.escape')
  closePreview(): void {
    if (this.preview?.url) URL.revokeObjectURL(this.preview.url);
    this.preview = null;
  }

  ngOnDestroy(): void {
    this.closePreview();
  }

  sendEmail(member: BirthdayMember): void {
    if (this.sendingEmailId) return;
    this.sendingEmailId = member.memberId;
    this.birthdayPostService.sendEmail(member.memberId).subscribe({
      next: res => {
        this.sendingEmailId = null;
        this.snackbar.showSuccess(this.languageService.translate(
          res.result === 'AlreadySent' ? 'birthdayAutomation.emailAlreadySent' : 'birthdayAutomation.emailSent'));
        this.loadBirthdays();
      },
      error: err => {
        this.sendingEmailId = null;
        this.snackbar.showError(err?.error?.message || this.languageService.translate('birthdayAutomation.emailFailedError'));
        this.loadBirthdays();
      }
    });
  }

  /** Today's birthday wishes already posted successfully (derived from the loaded list). */
  get postedTodayCount(): number {
    return this.birthdays.filter(b => b.status === 'Success').length;
  }

  /** Failed entries in the loaded post history. */
  get failedLogCount(): number {
    return this.logs.filter(l => l.status === 'Failed').length;
  }

  private loadSettings(): void {
    this.settingsLoading = true;
    this.birthdayPostService.getSettings().pipe(catchError(() => of(null))).subscribe(settings => {
      this.settingsLoading = false;
      if (!settings) return;

      this.applySettings(settings);
    });
  }

  private applySettings(settings: FacebookSettings): void {
    this.settings = settings;
    this.enabled = settings.enabled;
    this.emailEnabled = settings.emailEnabled;
    this.pageId = settings.pageId ?? '';
    this.postTime = settings.postTime;
    this.emailSubject = settings.emailSubject ?? settings.defaultEmailSubject ?? '';
    this.emailBody = settings.emailBody ?? settings.defaultEmailBody ?? '';
  }

  private loadBirthdays(): void {
    this.birthdaysLoading = true;
    this.birthdayPostService.getTodaysBirthdays().pipe(catchError(() => of([]))).subscribe(birthdays => {
      this.birthdaysLoading = false;
      this.birthdays = birthdays;
    });
  }

  private loadLogs(): void {
    this.logsLoading = true;
    this.birthdayPostService.getLogs(50).pipe(catchError(() => of([]))).subscribe(logs => {
      this.logsLoading = false;
      this.logs = logs;
    });
  }
}
