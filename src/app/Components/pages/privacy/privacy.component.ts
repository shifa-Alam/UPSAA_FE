import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, PLATFORM_ID, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

interface PolicySection {
  id?: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  /** Numbered steps (the data-deletion instructions). */
  steps?: string[];
  after?: string[];
}

interface PolicyText {
  title: string;
  subtitle: string;
  intro: string;
  contentsLabel: string;
  sections: PolicySection[];
}

const CONTACT = {
  email: 'info@uttaranalumni.org',
  phone: '01866 293776',
  address: 'Thana Road, Jhenaigati, Sherpur 2120',
};

/** Last change to the policy text — shown under the title. */
const UPDATED = { bn: '২৯ সেপ্টেম্বর ২০২৬', en: '29 September 2026' };

const BN: PolicyText = {
  title: 'গোপনীয়তা নীতি',
  subtitle: `হালনাগাদ: ${UPDATED.bn}`,
  intro: 'উত্তরণ পাবলিক স্কুল অ্যালামনাই অ্যাসোসিয়েশন (UPSAA) এই ওয়েবসাইট, সদস্য পোর্টাল ও আমাদের Facebook পেজ চালায়। এই নীতিতে বলা আছে আমরা কোন তথ্য রাখি, কেন রাখি, কার সাথে শেয়ার করি, আর কীভাবে আপনি আপনার তথ্য মুছে ফেলতে বলতে পারেন।',
  contentsLabel: 'এই পাতায়',
  sections: [
    {
      title: 'আমরা কোন তথ্য রাখি',
      items: [
        'নিবন্ধনের তথ্য: নাম, ব্যাচ, ফোন নম্বর, ইমেইল, জন্মতারিখ, লিঙ্গ, রক্তের গ্রুপ, ঠিকানা/শহর, পেশা ও প্রতিষ্ঠান, প্রোফাইল ছবি।',
        'পেমেন্টের তথ্য: টাকার পরিমাণ, মাধ্যম (bKash/Nagad/Rocket বা নগদ), পাঠানোর নম্বর ও ট্রানজেকশন আইডি (TrxID)। আমরা কখনো আপনার PIN বা পাসওয়ার্ড চাই না।',
        'আপনি যা জমা দেন: অর্জন, স্মৃতির ছবি, ব্যবসা, চাকরির পোস্ট, রক্তের অনুরোধ, নির্বাচনের মনোনয়ন।',
        'প্রযুক্তিগত তথ্য: লগইনের তথ্য, আপনি চালু করলে নোটিফিকেশনের অনুমতি, আর সমস্যা ধরতে সার্ভারের এরর লগ।',
      ],
    },
    {
      title: 'তথ্য কেন ব্যবহার করি',
      items: [
        'সদস্যপদ, সদস্য তালিকা ও ব্যাচভিত্তিক যোগাযোগ চালাতে।',
        'পেমেন্ট যাচাই করতে, রশিদ দিতে আর সংগঠনের হিসাব রাখতে।',
        'নোটিশ, ইভেন্ট, রিমাইন্ডার ও রশিদ জানাতে — ইমেইল, SMS বা নোটিফিকেশনে।',
        'জন্মদিনের শুভেচ্ছা জানাতে — সাইটে, ইমেইলে, আর আমাদের Facebook পেজে (নাম, ব্যাচ, পদ ও ছবির কার্ডসহ)।',
        'নির্বাচন পরিচালনা আর সাইটের নিরাপত্তা বজায় রাখতে।',
      ],
    },
    {
      title: 'আমাদের Facebook পেজ',
      paragraphs: [
        'আমরা একটি Facebook অ্যাপের মাধ্যমে শুধু আমাদের নিজস্ব Facebook পেজে পোস্ট করি: নোটিশ, ইভেন্ট, জন্মদিনের শুভেচ্ছা, আর সদস্যদের অনুমোদিত অর্জন, স্মৃতি, ব্যবসা, চাকরি ও ক্যাম্পেইন। রক্তের অনুরোধ Facebook-এ যায় শুধু অনুরোধকারী সম্মতি দিলে।',
        'এই অ্যাপ দিয়ে কেউ লগইন করেন না, আর আমরা Facebook ব্যবহারকারীদের কোনো তথ্য সংগ্রহ বা সংরক্ষণ করি না। আপনার সম্পর্কে কোনো পোস্ট সরাতে চাইলে নিচের ঠিকানায় জানান।',
      ],
    },
    {
      title: 'কে আপনার তথ্য দেখতে পান',
      items: [
        'সদস্য তালিকা ও যোগাযোগের তথ্য শুধু লগইন করা সদস্যরা দেখতে পান।',
        'পাবলিক সাইটে দেখায়: কার্যনির্বাহী কমিটি, আর অনুমোদনের পর প্রকাশিত অর্জন, স্মৃতি, ব্যবসা ও চাকরির পোস্ট।',
        'পেমেন্টের বিস্তারিত দেখেন শুধু আপনি আর দায়িত্বপ্রাপ্ত অ্যাডমিন/কোষাধ্যক্ষ।',
      ],
    },
    {
      title: 'কার সাথে শেয়ার করি',
      paragraphs: [
        'আমরা আপনার তথ্য বিক্রি করি না, বিজ্ঞাপনের জন্যও ব্যবহার করি না। শুধু যেসব সেবা ছাড়া সাইট চলে না, তাদের কাছে প্রয়োজনমতো তথ্য যায়: SMS পাঠানোর সেবা (ফোন নম্বর ও বার্তা), ইমেইল সেবা (ইমেইল ঠিকানা ও বার্তা), ওয়েবসাইট ও সার্ভার হোস্টিং, আর ওপরে বলা Facebook পোস্ট। আইন অনুযায়ী বাধ্য হলে কর্তৃপক্ষকে তথ্য দিতে পারি।',
      ],
    },
    {
      title: 'সুরক্ষা ও কতদিন রাখি',
      paragraphs: [
        'পাসওয়ার্ড হ্যাশ করে রাখা হয়, কেউ পড়তে পারে না। সাইট HTTPS দিয়ে চলে, আর অ্যাডমিন প্যানেলে ঢুকতে পারেন শুধু দায়িত্বপ্রাপ্তরা।',
        'সদস্যপদ থাকা পর্যন্ত তথ্য রাখা হয়। সংগঠনের হিসাবের জন্য পেমেন্টের রেকর্ড প্রয়োজনমতো দীর্ঘ সময় রাখা হতে পারে।',
      ],
    },
    {
      title: 'আপনার অধিকার',
      items: [
        'পোর্টালের "আমার প্রোফাইল" থেকে নিজের তথ্য দেখা ও বদলানো।',
        'ভুল তথ্য সংশোধন করতে বলা।',
        'SMS বা ইমেইল না পেতে চাইলে জানানো।',
        'নিচের নির্দেশনা অনুযায়ী আপনার অ্যাকাউন্ট ও তথ্য মুছে ফেলতে বলা।',
      ],
    },
    {
      id: 'data-deletion',
      title: 'তথ্য মুছে ফেলার নির্দেশনা',
      paragraphs: ['আপনার অ্যাকাউন্ট ও ব্যক্তিগত তথ্য মুছে ফেলতে চাইলে:'],
      steps: [
        `${CONTACT.email}-এ ইমেইল করুন, অথবা ${CONTACT.phone} নম্বরে ফোন বা WhatsApp করুন।`,
        'আপনার নাম, ব্যাচ আর নিবন্ধিত ফোন নম্বর বা ইমেইল জানান, এবং লিখুন "আমার তথ্য মুছে ফেলুন"।',
        'আমরা পরিচয় নিশ্চিত করে ৩০ দিনের মধ্যে আপনার অ্যাকাউন্ট, প্রোফাইল, ছবি ও জমা দেওয়া পোস্ট মুছে ফেলব, আর কাজ শেষে আপনাকে জানাব।',
        'চাইলে আমাদের Facebook পেজে আপনার সম্পর্কে করা পোস্টও সরিয়ে দেব।',
      ],
      after: ['সংগঠনের হিসাবের জন্য পেমেন্টের রেকর্ড (টাকার পরিমাণ ও তারিখ) রাখা লাগতে পারে; সেগুলো আপনার অন্য তথ্য থেকে আলাদা করে রাখা হবে। আমাদের Facebook অ্যাপ আপনার Facebook অ্যাকাউন্ট থেকে কোনো তথ্য রাখে না, তাই সেখানে মোছার মতো কিছু নেই।'],
    },
    {
      title: 'পরিবর্তন ও যোগাযোগ',
      paragraphs: [
        'এই নীতি বদলালে এই পাতায় নতুন তারিখসহ প্রকাশ করা হবে।',
        `প্রশ্ন থাকলে: ${CONTACT.email} · ${CONTACT.phone} · ${CONTACT.address}`,
      ],
    },
  ],
};

const EN: PolicyText = {
  title: 'Privacy Policy',
  subtitle: `Updated: ${UPDATED.en}`,
  intro: 'Uttaran Public School Alumni Association (UPSAA) runs this website, the member portal and our Facebook page. This policy explains what information we keep, why, who we share it with, and how you can ask us to delete it.',
  contentsLabel: 'On this page',
  sections: [
    {
      title: 'What we keep',
      items: [
        'Registration details: name, batch, phone number, email, date of birth, gender, blood group, address/city, profession and organisation, profile photo.',
        'Payment details: amount, method (bKash/Nagad/Rocket or cash), the sending number and transaction ID (TrxID). We never ask for your PIN or password.',
        'What you submit: achievements, memory photos, businesses, job posts, blood requests, election nominations.',
        'Technical information: sign-in data, notification permission if you turn it on, and server error logs used to fix problems.',
      ],
    },
    {
      title: 'Why we use it',
      items: [
        'To run membership, the member directory and batch contact.',
        'To verify payments, issue receipts and keep the association\'s accounts.',
        'To tell you about notices, events, reminders and receipts — by email, SMS or notification.',
        'To send birthday wishes — on the site, by email and on our Facebook page (with name, batch, position and a photo card).',
        'To run elections and keep the site secure.',
      ],
    },
    {
      title: 'Our Facebook page',
      paragraphs: [
        'We use a Facebook app only to publish to our own Facebook page: notices, events, birthday wishes, and members\' approved achievements, memories, businesses, jobs and campaigns. A blood request goes to Facebook only when the requester agrees.',
        'Nobody signs in with this app, and we do not collect or store any information about Facebook users. To have a post about you removed, contact us at the address below.',
      ],
    },
    {
      title: 'Who can see your information',
      items: [
        'The member directory and contact details are visible only to signed-in members.',
        'The public site shows the executive committee and, once approved, published achievements, memories, businesses and job posts.',
        'Payment details are seen only by you and the responsible admins/treasurer.',
      ],
    },
    {
      title: 'Who we share it with',
      paragraphs: [
        'We do not sell your information or use it for advertising. Only the services the site cannot run without receive what they need: the SMS service (phone number and message), the email service (email address and message), website and server hosting, and the Facebook posts described above. We may share information with authorities when the law requires it.',
      ],
    },
    {
      title: 'Security and how long we keep it',
      paragraphs: [
        'Passwords are stored hashed, so no one can read them. The site runs over HTTPS, and only authorised people can enter the admin panel.',
        'We keep your information while you are a member. Payment records may be kept longer where the association\'s accounts require it.',
      ],
    },
    {
      title: 'Your rights',
      items: [
        'See and change your details under "My Profile" in the portal.',
        'Ask us to correct wrong information.',
        'Tell us if you do not want SMS or email.',
        'Ask us to delete your account and information, as described below.',
      ],
    },
    {
      id: 'data-deletion',
      title: 'Data deletion instructions',
      paragraphs: ['To have your account and personal information deleted:'],
      steps: [
        `Email ${CONTACT.email}, or call or WhatsApp ${CONTACT.phone}.`,
        'Give your name, batch and registered phone number or email, and say "Please delete my data".',
        'We confirm it is you and, within 30 days, delete your account, profile, photos and submitted posts, then let you know it is done.',
        'On request we also remove posts about you from our Facebook page.',
      ],
      after: ['Payment records (amount and date) may need to be kept for the association\'s accounts; they are kept apart from the rest of your information. Our Facebook app stores nothing from your Facebook account, so there is nothing to delete there.'],
    },
    {
      title: 'Changes and contact',
      paragraphs: [
        'If this policy changes, the new version is published on this page with a new date.',
        `Questions: ${CONTACT.email} · ${CONTACT.phone} · ${CONTACT.address}`,
      ],
    },
  ],
};

/**
 * Privacy policy and data-deletion instructions — public, no login. /data-deletion opens the
 * same page at the deletion section (Facebook asks for both links).
 */
@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent implements AfterViewInit {
  private readonly language = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly text = computed(() => this.language.lang() === 'bn' ? BN : EN);

  ngAfterViewInit(): void {
    const section = this.route.snapshot.data['section'] as string | undefined;
    if (!section || !this.isBrowser) return; // prerender: nothing to scroll
    // After the first paint, so the section is laid out before we scroll to it.
    setTimeout(() => (this.host.nativeElement as HTMLElement).querySelector(`#${section}`)?.scrollIntoView({ block: 'start' }));
  }

  anchor(id: string): void {
    (this.host.nativeElement as HTMLElement).querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  sectionId(section: PolicySection, index: number): string {
    return section.id ?? `section-${index + 1}`;
  }
}
