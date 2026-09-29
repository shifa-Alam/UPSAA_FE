import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../Services/language.service';
import { PwaService } from '../../../Services/pwa.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

type Device = 'android' | 'ios' | 'desktop';

interface InstallText {
  title: string;
  subtitle: string;
  installedTitle: string;
  installedText: string;
  readyTitle: string;
  readyText: string;
  installNow: string;
  inAppTitle: string;
  inAppText: string;
  copyLink: string;
  copied: string;
  whyTitle: string;
  why: { icon: string; text: string }[];
  howTitle: string;
  tabs: Record<Device, string>;
  steps: Record<Device, string[]>;
  notes: Record<Device, string>;
}

const SITE = 'upsaa-fe.vercel.app';

const BN: InstallText = {
  title: 'UPSAA অ্যাপ ইনস্টল করুন',
  subtitle: 'Play Store লাগবে না — এক মিনিটে ফোন বা কম্পিউটারে',
  installedTitle: 'আপনি অ্যাপটি ব্যবহার করছেন',
  installedText: 'UPSAA এখন আপনার হোম স্ক্রিনে আছে — সেখান থেকেই খুলুন।',
  readyTitle: 'আপনার ফোনে ইনস্টল করা যাবে',
  readyText: 'নিচের বোতাম চাপুন, তারপর «ইনস্টল» নিশ্চিত করুন।',
  installNow: 'এখনই ইনস্টল করুন',
  inAppTitle: 'Facebook বা Messenger-এর ভেতর থেকে ইনস্টল হয় না',
  inAppText: 'লিংকটা কপি করে Chrome (Android) বা Safari (iPhone)-এ খুলুন, তারপর নিচের ধাপগুলো অনুসরণ করুন।',
  copyLink: 'লিংক কপি করুন',
  copied: 'কপি হয়েছে',
  whyTitle: 'কেন অ্যাপ হিসেবে রাখবেন',
  why: [
    { icon: 'bolt', text: 'হোম স্ক্রিনের আইকনে এক চাপে খোলে, দ্রুত চলে' },
    { icon: 'notifications', text: 'নতুন নোটিশ ও ইভেন্টের নোটিফিকেশন পাবেন' },
    { icon: 'wifi_off', text: 'ইন্টারনেট দুর্বল হলেও আগে দেখা পাতা খোলে' },
    { icon: 'download', text: 'Play Store লাগে না, ফোনের জায়গাও প্রায় লাগে না' },
  ],
  howTitle: 'কীভাবে ইনস্টল করবেন',
  tabs: { android: 'Android', ios: 'iPhone', desktop: 'কম্পিউটার' },
  steps: {
    android: [
      `Chrome-এ ${SITE} খুলুন।`,
      'উপরে ডান কোণের ⋮ (তিন বিন্দু) মেনু চাপুন।',
      '«অ্যাপ ইনস্টল করুন» বা «হোম স্ক্রিনে যোগ করুন» বেছে নিন।',
      '«ইনস্টল» চাপুন — হোম স্ক্রিনে UPSAA আইকন আসবে।',
    ],
    ios: [
      `Safari-তে ${SITE} খুলুন।`,
      'নিচের Share বোতাম (বাক্স থেকে উপরে তীর) চাপুন।',
      'তালিকা থেকে «Add to Home Screen» বেছে নিন।',
      'উপরে ডানে «Add» চাপুন — হোম স্ক্রিনে UPSAA আইকন আসবে।',
    ],
    desktop: [
      `Chrome বা Edge-এ ${SITE} খুলুন।`,
      'ঠিকানা বারের ডান পাশের ইনস্টল চিহ্নে (মনিটরে তীর) চাপুন।',
      'চিহ্ন না দেখালে ⋮ মেনু › «Save and share» বা «Apps» › «Install UPSAA» বেছে নিন।',
      '«Install» চাপুন — UPSAA আলাদা উইন্ডোতে খুলবে, ডেস্কটপে শর্টকাটও থাকবে।',
    ],
  },
  notes: {
    android: 'Samsung Internet-এ: নিচের মেনু › «Add page to» › «Home screen»।',
    ios: 'নোটিফিকেশন পেতে iPhone-এ অ্যাপটি হোম স্ক্রিন থেকে খুলে নোটিফিকেশন চালু করুন (iOS 16.4 বা নতুন লাগবে)।',
    desktop: 'Firefox ও Safari (Mac) এখনো সরাসরি ইনস্টল সমর্থন করে না — Chrome বা Edge ব্যবহার করুন।',
  },
};

const EN: InstallText = {
  title: 'Install the UPSAA app',
  subtitle: 'No Play Store needed — on your phone or computer in a minute',
  installedTitle: 'You are using the app',
  installedText: 'UPSAA is on your home screen — open it from there.',
  readyTitle: 'Ready to install on this device',
  readyText: 'Tap the button below, then confirm "Install".',
  installNow: 'Install now',
  inAppTitle: "Installing doesn't work inside Facebook or Messenger",
  inAppText: 'Copy the link and open it in Chrome (Android) or Safari (iPhone), then follow the steps below.',
  copyLink: 'Copy link',
  copied: 'Copied',
  whyTitle: 'Why keep it as an app',
  why: [
    { icon: 'bolt', text: 'Opens in one tap from your home screen, and runs fast' },
    { icon: 'notifications', text: 'Get notified about new notices and events' },
    { icon: 'wifi_off', text: 'Pages you have seen open even on a weak connection' },
    { icon: 'download', text: 'No Play Store, and it takes almost no space' },
  ],
  howTitle: 'How to install',
  tabs: { android: 'Android', ios: 'iPhone', desktop: 'Computer' },
  steps: {
    android: [
      `Open ${SITE} in Chrome.`,
      'Tap the ⋮ (three dots) menu at the top right.',
      'Choose "Install app" or "Add to Home screen".',
      'Tap "Install" — the UPSAA icon appears on your home screen.',
    ],
    ios: [
      `Open ${SITE} in Safari.`,
      'Tap the Share button at the bottom (a box with an arrow pointing up).',
      'Choose "Add to Home Screen" from the list.',
      'Tap "Add" at the top right — the UPSAA icon appears on your home screen.',
    ],
    desktop: [
      `Open ${SITE} in Chrome or Edge.`,
      'Click the install icon at the right of the address bar (a screen with an arrow).',
      'If it is not there: ⋮ menu › "Save and share" or "Apps" › "Install UPSAA".',
      'Click "Install" — UPSAA opens in its own window, with a desktop shortcut.',
    ],
  },
  notes: {
    android: 'In Samsung Internet: the bottom menu › "Add page to" › "Home screen".',
    ios: 'For notifications on iPhone, open the app from the home screen and turn them on there (needs iOS 16.4 or later).',
    desktop: "Firefox and Safari (Mac) don't support installing directly yet — use Chrome or Edge.",
  },
};

/**
 * "Install the app" page: a one-tap Install button where the browser offers it (Android and
 * desktop Chrome/Edge), otherwise step-by-step instructions for the visitor's device —
 * iPhone Safari can only add to the home screen by hand. Warns when opened inside the
 * Facebook/Messenger in-app browser, which can't install anything.
 */
@Component({
  selector: 'app-install',
  standalone: true,
  imports: [CommonModule, MatIconModule, PageHeaderComponent],
  templateUrl: './install.component.html',
  styleUrl: './install.component.scss'
})
export class InstallComponent implements OnInit {
  readonly pwa = inject(PwaService);
  private readonly language = inject(LanguageService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly text = computed(() => this.language.lang() === 'bn' ? BN : EN);
  readonly devices: Device[] = ['android', 'ios', 'desktop'];
  readonly device = signal<Device>('android');
  readonly inAppBrowser = signal(false);
  readonly copied = signal(false);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const ua = navigator.userAgent;
    this.device.set(this.pwa.isIos() ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop');
    this.inAppBrowser.set(/FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\//i.test(ua));
  }

  install(): void {
    this.pwa.install();
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`https://${SITE}/install`);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    } catch { /* clipboard blocked — the address is on screen anyway */ }
  }
}
