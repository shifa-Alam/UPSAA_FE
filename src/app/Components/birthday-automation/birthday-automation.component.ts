import { CommonModule } from '@angular/common';
import { Component, inject, HostListener, OnDestroy, OnInit } from '@angular/core';
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
import { ConfirmService } from '../../Services/confirm.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';
import { SizedImagePipe, SizedSrcsetPipe } from '../../Pipes/sized-image.pipe';
import { FacebookPageService, PagePostRow } from '../../Services/facebook-page.service';
import { todayDateOnly } from '../../Utils/date-utils';
import { FbPostStatusComponent } from '../shared/fb-post-status/fb-post-status.component';

import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { RouterLink } from '@angular/router';
type BirthdayTab = 'birthdays' | 'messages' | 'history';
const TAB_KEY = 'upsaa.birthdayAutomation.tab';

import { MatDialog } from '@angular/material/dialog';
import { SmsService } from '../../Services/sms.service';
import { SmsSendDialogComponent, SmsSendDialogData, SmsSendDialogResult } from '../shared/sms-send-button/sms-send-dialog.component';
@Component({
  selector: 'app-birthday-automation',
  standalone: true,
  imports: [RouterLink, FbPostStatusComponent, SkeletonComponent, CommonModule, FormsModule, MatIconModule, EmptyStateComponent, AdminHeaderComponent, SectionCardComponent, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './birthday-automation.component.html',
  styleUrl: './birthday-automation.component.scss'
})
export class BirthdayAutomationComponent implements OnInit, OnDestroy {
  settings: FacebookSettings | null = null;
  settingsLoading = true;
  saving = false;

  enabled = false;
  emailEnabled = false;
  /** The page is split into tabs — the birthday list first, the everyday job. */
  tab: BirthdayTab = 'birthdays';

  /** What has gone (or is about to go) to the Facebook page — every kind together. */
  recentPosts: PagePostRow[] = [];
  recentLoading = true;
  private facebookPage = inject(FacebookPageService);
  private confirmService = inject(ConfirmService);
  private smsApi = inject(SmsService);
  private smsDialog = inject(MatDialog);
  /** SMS switched on (gateway enabled) — then today's rows offer the wish by SMS. */
  smsOn = false;
  sendingSmsId: number | null = null;
  /** Today's birthday SMS per member, from the SMS log. */
  smsStatus: Partial<Record<number, { status: string; error: string | null; at: string }>> = {};
  /** The Settings › SMS wording, to start the edit from. */
  private smsTemplate = '';
  postTime = '09:00';

  // Birthday email wording (keep limits in sync with BirthdayEmailTemplate on the server).
  emailSubject = '';
  emailBody = '';
  readonly maxSubjectLength = 300;
  readonly maxBodyLength = 5000;

  // Facebook birthday post message (limit in sync with BirthdayEmailTemplate.MaxPostMessageLength).
  postMessage = '';
  readonly maxPostMessageLength = 5000;
  readonly placeholders = [
    { token: '{name}', labelKey: 'birthdayAutomation.phName' },
    { token: '{batch}', labelKey: 'birthdayAutomation.phBatch' },
    { token: '{position}', labelKey: 'birthdayAutomation.phPosition' },
    { token: '{card}', labelKey: 'birthdayAutomation.phCard' },
  ];

  /** The day whose birthdays are listed ("yyyy-MM-dd") — today, or an earlier day to post a missed one. */
  birthdayDate = todayDateOnly();

  /**
   * Review-and-post panel for one member: the card (or the admin's own picture) and the wish,
   * both editable, then posted by hand.
   */
  compose: {
    member: BirthdayMember;
    /** The card as it would be posted (object URL). */
    cardUrl: string | null;
    loadingCard: boolean;
    /** A picture chosen for this post, and its object URL. */
    photo: File | null;
    photoUrl: string | null;
    /** Post the chosen picture on its own instead of a card. */
    asIs: boolean;
    caption: string;
    posting: boolean;
  } | null = null;
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

  selectTab(tab: BirthdayTab): void {
    this.tab = tab;
    try { localStorage.setItem(TAB_KEY, tab); } catch { /* private mode — just don't remember it */ }
  }

  ngOnInit(): void {
    this.initSms();
    try {
      const saved = localStorage.getItem(TAB_KEY) as BirthdayTab | null;
      if (saved && ['birthdays', 'messages', 'history'].includes(saved)) this.tab = saved;
    } catch { /* ignore */ }
    this.loadSettings();
    this.loadBirthdays();
    this.loadLogs();
    this.loadRecentPosts();
  }

  loadRecentPosts(): void {
    this.recentLoading = true;
    this.facebookPage.recent().pipe(catchError(() => of([] as PagePostRow[]))).subscribe(rows => {
      this.recentLoading = false;
      this.recentPosts = rows;
    });
  }

  saveSettings(): void {
    if (this.enabled && !this.fbConnected) {
      this.snackbar.showError(this.languageService.translate('birthdayAutomation.pageIdRequiredError'));
      return;
    }
    if (this.emailSubject.length > this.maxSubjectLength || this.emailBody.length > this.maxBodyLength) {
      this.snackbar.showError(this.languageService.translate('birthdayAutomation.emailTooLongError'));
      return;
    }
    if (this.postMessage.length > this.maxPostMessageLength) {
      this.snackbar.showError(this.languageService.translate('birthdayAutomation.postMessageTooLong'));
      return;
    }

    this.saving = true;
    this.birthdayPostService.updateSettings({
      enabled: this.enabled,
      postTime: this.postTime,
      emailEnabled: this.emailEnabled,
      emailSubject: this.emailSubject,
      emailBody: this.emailBody,
      postMessage: this.postMessage
    }).pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('birthdayAutomation.saveFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      this.applySettings(result);
      this.snackbar.showSuccess(this.languageService.translate('birthdayAutomation.saveSuccess'));
      this.loadBirthdays(); // the review panel starts from the saved message
    });
  }

  /** Insert a placeholder at the cursor of the subject input, the email body or the Facebook message. */
  insertPlaceholder(token: string, field: HTMLInputElement | HTMLTextAreaElement, target: 'subject' | 'body' | 'post'): void {
    const value = target === 'subject' ? this.emailSubject : target === 'body' ? this.emailBody : this.postMessage;
    const start = field.selectionStart ?? value.length;
    const end = field.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    if (target === 'subject') this.emailSubject = next;
    else if (target === 'body') this.emailBody = next;
    else this.postMessage = next;
    setTimeout(() => {
      field.focus();
      field.setSelectionRange(start + token.length, start + token.length);
    });
  }

  /** API times are UTC; some come with the "Z", some without — add it only when missing. */
  asUtc(value: string): string {
    return /(Z|[+-]\d\d:\d\d)$/.test(value) ? value : value + 'Z';
  }

  /** The page id and token are set (on the Settings page) — posting can work. */
  get fbConnected(): boolean {
    return !!this.settings?.pageId && !!this.settings?.hasAccessToken;
  }

  /** The automatic-posting bar has unsaved changes. */
  get automationChanged(): boolean {
    return !!this.settings && (this.enabled !== this.settings.enabled || this.postTime.slice(0, 5) !== (this.settings.postTime ?? '').slice(0, 5));
  }

  resetPostMessage(): void {
    if (this.settings) this.postMessage = this.settings.defaultPostMessage;
  }

  get postMessageIsDefault(): boolean {
    return !!this.settings && this.postMessage.replace(/\r\n/g, '\n').trim() === this.settings.defaultPostMessage;
  }

  /** The Facebook message as it would read for the sample member. */
  get previewPostMessage(): string {
    const text = (this.postMessage.trim() || this.settings?.defaultPostMessage || '').replace(/\r\n/g, '\n');
    return this.fill(text).replace(/\{card\}/g, '').trim();
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

  get isToday(): boolean {
    return this.birthdayDate === todayDateOnly();
  }

  onBirthdayDateChange(): void {
    if (!this.birthdayDate) this.birthdayDate = todayDateOnly();
    this.loadBirthdays();
  }

  showToday(): void {
    this.birthdayDate = todayDateOnly();
    this.loadBirthdays();
  }

  // ---------------------------------------------------------------- review and post by hand

  openPreview(member: BirthdayMember): void {
    this.closePreview();
    this.compose = {
      member, cardUrl: null, loadingCard: true, photo: null, photoUrl: null, asIs: false,
      caption: member.wishText || '', posting: false
    };
    this.refreshCard();
  }

  /** The picture shown in the panel — the admin's own when posting it as it is, otherwise the card. */
  get composeImage(): string | null {
    const c = this.compose;
    if (!c) return null;
    return c.asIs && c.photoUrl ? c.photoUrl : c.cardUrl;
  }

  onComposePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file || !this.compose) return;
    if (file.size > 10 * 1024 * 1024) {
      this.snackbar.showError(this.languageService.translate('birthdayAutomation.composePhotoTooBig'));
      return;
    }
    if (this.compose.photoUrl) URL.revokeObjectURL(this.compose.photoUrl);
    this.compose.photo = file;
    this.compose.photoUrl = URL.createObjectURL(file);
    this.refreshCard();
  }

  clearComposePhoto(): void {
    const c = this.compose;
    if (!c) return;
    if (c.photoUrl) URL.revokeObjectURL(c.photoUrl);
    c.photo = null;
    c.photoUrl = null;
    c.asIs = false;
    this.refreshCard();
  }

  resetComposeCaption(): void {
    if (this.compose) this.compose.caption = this.compose.member.wishText || '';
  }

  /** Redraw the card (with the chosen picture, if any). */
  private refreshCard(): void {
    const c = this.compose;
    if (!c) return;
    c.loadingCard = true;
    this.birthdayPostService.previewCard(c.member.memberId, c.photo).pipe(catchError(() => of(null))).subscribe(blob => {
      if (this.compose !== c) return;
      c.loadingCard = false;
      if (!blob) {
        this.snackbar.showError(this.languageService.translate('birthdayAutomation.cardFailedError'));
        return;
      }
      if (c.cardUrl) URL.revokeObjectURL(c.cardUrl);
      c.cardUrl = URL.createObjectURL(blob);
    });
  }

  postCompose(force = false): void {
    const c = this.compose;
    if (!c || c.posting) return;
    const ask = force || c.member.status === 'Success'
      ? { message: this.languageService.translate('birthdayAutomation.composeRepostConfirm') }
      : {
        title: this.languageService.translate('birthdayAutomation.composeConfirmTitle'),
        message: this.languageService.translate('birthdayAutomation.composeConfirmMessage'),
        confirmText: this.languageService.translate('birthdayAutomation.composePost')
      };
    this.confirmService.ask(ask).subscribe(ok => {
      if (!ok || this.compose !== c) return;
      c.posting = true;
      this.birthdayPostService.postManual(c.member.memberId, {
        caption: c.caption, photo: c.photo, photoAsIs: c.asIs, force: force || c.member.status === 'Success', date: this.birthdayDate
      }).subscribe({
        next: () => {
          c.posting = false;
          c.member.status = 'Success';
          this.snackbar.showSuccess(this.languageService.translate('birthdayAutomation.composePosted'));
          this.closePreview();
          this.loadLogs();
        },
        error: err => {
          c.posting = false;
          if (err?.status === 409) {
            c.member.status = 'Success';
            this.postCompose(true);
            return;
          }
          c.member.status = 'Failed';
          this.snackbar.showError(err?.error?.message || this.languageService.translate('birthdayAutomation.composeFailed'));
          this.loadLogs();
        }
      });
    });
  }

  @HostListener('document:keydown.escape')
  closePreview(): void {
    const c = this.compose;
    if (c?.cardUrl) URL.revokeObjectURL(c.cardUrl);
    if (c?.photoUrl) URL.revokeObjectURL(c.photoUrl);
    this.compose = null;
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
    this.postTime = settings.postTime;
    this.emailSubject = settings.emailSubject ?? settings.defaultEmailSubject ?? '';
    this.emailBody = settings.emailBody ?? settings.defaultEmailBody ?? '';
    this.postMessage = settings.postMessage ?? settings.defaultPostMessage ?? '';
  }

  private loadBirthdays(): void {
    this.birthdaysLoading = true;
    this.birthdayPostService.getTodaysBirthdays(this.isToday ? undefined : this.birthdayDate).pipe(catchError(() => of([]))).subscribe(birthdays => {
      this.birthdaysLoading = false;
      this.birthdays = birthdays;
      this.loadSmsStatus();
    });
  }

  private loadLogs(): void {
    this.logsLoading = true;
    this.birthdayPostService.getLogs(50).pipe(catchError(() => of([]))).subscribe(logs => {
      this.logsLoading = false;
      this.logs = logs;
    });
  }

  /** Called once from ngOnInit: is SMS on, and the wording to start from. */
  private initSms(): void {
    this.smsApi.status().pipe(catchError(() => of(null))).subscribe(s => {
      this.smsOn = !!s?.gatewayEnabled;
      this.smsTemplate = (s?.smsBirthdayMessage || s?.defaultBirthdayMessage || '').trim();
      this.loadSmsStatus();
    });
  }

  private loadSmsStatus(): void {
    if (!this.smsOn || !this.isToday || !this.birthdays.length) return;
    this.smsApi.birthdayStatus(this.birthdays.map(b => b.memberId)).pipe(catchError(() => of({})))
      .subscribe(s => this.smsStatus = s);
  }

  /** The wish as it will read for this member ({name}, {batch} filled in) — editable before sending. */
  private smsTextFor(member: BirthdayMember): string {
    const batch = member.batch ? String(member.batch).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]) : '';
    return this.smsTemplate.replace(/\{name\}/g, member.fullName.trim()).replace(/\{batch\}/g, batch);
  }

  sendBirthdaySms(member: BirthdayMember): void {
    if (this.sendingSmsId) return;
    const again = this.smsStatus[member.memberId]?.status === 'sent';
    const data: SmsSendDialogData = {
      title: `${this.languageService.translate('smsBirthday.dialogTitle')} — ${member.fullName}`,
      reach: 1, left: null, text: this.smsTextFor(member), maxLength: 320, again,
    };
    this.smsDialog.open<SmsSendDialogComponent, SmsSendDialogData, SmsSendDialogResult>(SmsSendDialogComponent,
      { data, width: '460px', maxWidth: '94vw' }).afterClosed().subscribe(r => {
        if (!r) return;
        this.sendingSmsId = member.memberId;
        this.smsApi.birthday(member.memberId, r.text, again).subscribe({
          next: () => {
            this.sendingSmsId = null;
            this.smsStatus = { ...this.smsStatus, [member.memberId]: { status: 'sent', error: null, at: new Date().toISOString() } };
            this.snackbar.showSuccess(this.languageService.translate('smsBirthday.sentOk'));
          },
          error: err => {
            this.sendingSmsId = null;
            this.snackbar.showError(err?.error?.message || this.languageService.translate('smsSend.failed'));
          }
        });
      });
  }
}
