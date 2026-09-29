import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { BirthdayPostService, FacebookSettings, FacebookSettingsUpdate } from '../../Services/birthday-post.service';
import { AuthService } from '../../Services/auth.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { SettingsSmsComponent } from './settings-sms.component';
import { SettingsPaymentComponent } from './settings-payment.component';
import { ConfigFieldsComponent } from './config-fields.component';

type SettingsTab = 'facebook' | 'email' | 'sms' | 'payment' | 'general';
const TABS: SettingsTab[] = ['facebook', 'email', 'sms', 'payment', 'general'];
type AutoPostKey = 'notices' | 'events' | 'achievements' | 'memories' | 'businesses' | 'jobs' | 'campaigns' | 'bloodRequests';

/**
 * Settings (/dashboard/settings/:tab) — one tab per service: the Facebook page (page id,
 * token, what goes to it), email (who mail comes from, the sender name, a test), SMS (what
 * goes out by itself, the monthly cap, a test) and payment (receiving numbers, fees).
 * Each tab saves only its own fields (the API update is partial), so saving one never
 * touches the other or the birthday page's settings.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe, AdminHeaderComponent, SectionCardComponent, SkeletonComponent,
    SettingsSmsComponent, SettingsPaymentComponent, ConfigFieldsComponent],
  templateUrl: './app-settings.component.html',
  styleUrl: './app-settings.component.scss'
})
export class AppSettingsComponent implements OnInit {
  private api = inject(BirthdayPostService);
  private auth = inject(AuthService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  tab: SettingsTab = 'facebook';
  settings: FacebookSettings | null = null;
  loading = true;
  saving = false;

  // ---- Facebook page
  pageId = '';
  pageAccessToken = '';
  autoPost: Record<AutoPostKey, boolean> = {
    notices: false, events: false, achievements: false, memories: false,
    businesses: false, jobs: false, campaigns: false, bloodRequests: false
  };
  readonly autoPostKinds: { key: AutoPostKey; icon: string; kind: string }[] = [
    { key: 'notices', icon: 'campaign', kind: 'notice' },
    { key: 'events', icon: 'event', kind: 'event' },
    { key: 'achievements', icon: 'military_tech', kind: 'achievement' },
    { key: 'memories', icon: 'auto_stories', kind: 'memory' },
    { key: 'businesses', icon: 'storefront', kind: 'business' },
    { key: 'jobs', icon: 'work', kind: 'job' },
    { key: 'campaigns', icon: 'volunteer_activism', kind: 'campaign' },
    { key: 'bloodRequests', icon: 'bloodtype', kind: 'blood' },
  ];

  // ---- Email
  emailFromName = '';
  testEmailTo = '';
  sendingTest = false;
  testResult: { ok: boolean; message: string } | null = null;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
      const tab = p.get('tab');
      if (TABS.includes(tab as SettingsTab) && (tab !== 'general' || this.auth.hasRole('SuperAdmin'))) this.tab = tab as SettingsTab;
      else this.router.navigate(['/dashboard/settings', 'facebook'], { replaceUrl: true });
    });
    this.api.getSettings().pipe(catchError(() => of(null))).subscribe(s => {
      this.loading = false;
      if (s) this.apply(s);
      else this.snackbar.showError(this.lang.translate('appSettings.loadFailed'));
    });
  }

  /** System settings (SMTP, SMS gateway, general) are SuperAdmin-only. */
  get isSuperAdmin(): boolean {
    return this.auth.hasRole('SuperAdmin');
  }

  /** After SMTP settings change: re-read the status (is email set up, who it comes from). */
  reloadSettings(): void {
    this.api.getSettings().pipe(catchError(() => of(null))).subscribe(s => { if (s) this.apply(s); });
  }

  selectTab(tab: SettingsTab): void {
    this.router.navigate(['/dashboard/settings', tab]);
  }

  /** The page id and token are saved — posting to the page can work. */
  get fbConnected(): boolean {
    return !!this.settings?.pageId && !!this.settings?.hasAccessToken;
  }

  saveFacebook(): void {
    this.save({
      pageId: this.pageId.trim(),
      pageAccessToken: this.pageAccessToken.trim() || null,
      autoPostNotices: this.autoPost.notices,
      autoPostEvents: this.autoPost.events,
      autoPostAchievements: this.autoPost.achievements,
      autoPostMemories: this.autoPost.memories,
      autoPostBusinesses: this.autoPost.businesses,
      autoPostJobs: this.autoPost.jobs,
      autoPostCampaigns: this.autoPost.campaigns,
      autoPostBloodRequests: this.autoPost.bloodRequests
    });
  }

  saveEmail(): void {
    this.save({ emailFromName: this.emailFromName.trim() });
  }

  /** Send a test email with the sender name as typed (saved or not), and show what happened. */
  sendTestEmail(): void {
    if (this.sendingTest) return;
    const to = this.testEmailTo.trim();
    if (!to) {
      this.testResult = { ok: false, message: this.lang.translate('birthdayAutomation.testEmailNeedAddress') };
      return;
    }
    this.sendingTest = true;
    this.testResult = null;
    this.api.sendTestEmail(to, this.emailFromName.trim()).subscribe({
      next: res => {
        this.sendingTest = false;
        this.testResult = { ok: true, message: this.lang.translate('birthdayAutomation.testEmailSent').replace('{to}', res.to) };
      },
      error: err => {
        this.sendingTest = false;
        this.testResult = { ok: false, message: err?.error?.message || this.lang.translate('birthdayAutomation.testEmailFailed') };
      }
    });
  }

  private save(patch: Partial<FacebookSettingsUpdate>): void {
    if (this.saving) return;
    this.saving = true;
    this.api.updateSettings(patch).subscribe({
      next: s => {
        this.saving = false;
        this.pageAccessToken = '';
        this.apply(s);
        this.snackbar.showSuccess(this.lang.translate('birthdayAutomation.saveSuccess'));
      },
      error: err => {
        this.saving = false;
        this.snackbar.showError(err?.error?.message || this.lang.translate('birthdayAutomation.saveFailedError'));
      }
    });
  }

  private apply(s: FacebookSettings): void {
    this.settings = s;
    this.pageId = s.pageId ?? '';
    this.autoPost = {
      notices: s.autoPostNotices ?? false,
      events: s.autoPostEvents ?? false,
      achievements: s.autoPostAchievements ?? false,
      memories: s.autoPostMemories ?? false,
      businesses: s.autoPostBusinesses ?? false,
      jobs: s.autoPostJobs ?? false,
      campaigns: s.autoPostCampaigns ?? false,
      bloodRequests: s.autoPostBloodRequests ?? false,
    };
    this.emailFromName = s.emailFromName ?? s.defaultEmailFromName ?? '';
    if (!this.testEmailTo) this.testEmailTo = this.auth.getCurrentUser()?.email ?? '';
  }
}
