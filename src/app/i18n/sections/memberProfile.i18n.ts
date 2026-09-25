import { I18nSection } from '../i18n.types';

/** An alumnus's public profile page (/members/:id). */
export const memberProfileI18n: I18nSection = {
  bn: {
    memberProfile: {
      eyebrow: 'অ্যালামনাই প্রোফাইল',
      back: 'অ্যালামনাই তালিকা',
      loading: 'প্রোফাইল লোড হচ্ছে…',
      notFoundTitle: 'প্রোফাইলটি পাওয়া যায়নি',
      notFoundMessage: 'এই সদস্যের প্রোফাইল নেই, অথবা এখনো অনুমোদিত হয়নি।',
      contactTitle: 'যোগাযোগ',
      birthday: 'জন্মদিন',
      signInToSee: 'ফোন, ইমেইল ও জন্মদিন শুধু লগইন করা অ্যালামনাইরা দেখতে পান।',
      private: 'এই সদস্য তাঁর যোগাযোগের তথ্য লুকিয়ে রেখেছেন।',
      signIn: 'লগইন করুন',
      viewProfile: 'প্রোফাইল দেখুন',
    },
  },
  en: {
    memberProfile: {
      eyebrow: 'Alumni profile',
      back: 'Alumni directory',
      loading: 'Loading profile…',
      notFoundTitle: 'Profile not found',
      notFoundMessage: 'This member has no profile, or hasn’t been approved yet.',
      contactTitle: 'Contact',
      birthday: 'Birthday',
      signInToSee: 'Phone, email and birthday are visible to signed-in alumni only.',
      private: 'This member keeps their contact details private.',
      signIn: 'Sign in',
      viewProfile: 'View profile',
    },
  },
};
