import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-birthday-automation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, EmptyStateComponent, AdminHeaderComponent, SectionCardComponent, TranslatePipe],
  templateUrl: './birthday-automation.component.html',
  styleUrl: './birthday-automation.component.scss'
})
export class BirthdayAutomationComponent implements OnInit {
  settings: FacebookSettings | null = null;
  settingsLoading = true;
  saving = false;

  enabled = false;
  pageId = '';
  pageAccessToken = '';
  postTime = '09:00';

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

    this.saving = true;
    this.birthdayPostService.updateSettings({
      enabled: this.enabled,
      pageId: this.pageId.trim() || null,
      pageAccessToken: this.pageAccessToken.trim() || null,
      postTime: this.postTime
    }).pipe(
      catchError(() => {
        this.snackbar.showError(this.languageService.translate('birthdayAutomation.saveFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      this.settings = result;
      this.pageAccessToken = '';
      this.snackbar.showSuccess(this.languageService.translate('birthdayAutomation.saveSuccess'));
    });
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
        this.languageService.translate('birthdayAutomation.runSuccess').replace('{count}', String(result.processed))
      );
      this.loadBirthdays();
      this.loadLogs();
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

      this.settings = settings;
      this.enabled = settings.enabled;
      this.pageId = settings.pageId ?? '';
      this.postTime = settings.postTime;
    });
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
