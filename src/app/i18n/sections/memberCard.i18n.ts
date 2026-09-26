import { I18nSection } from '../i18n.types';

/** Digital member card on the profile page. */
export const memberCardI18n: I18nSection = {
  bn: {
    memberCard: {
      title: 'ডিজিটাল মেম্বার কার্ড',
      subtitle: 'ছবি, মেম্বার আইডি, ব্যাচ ও QR কোডসহ আপনার সদস্য কার্ড। QR স্ক্যান করলে আপনার পাবলিক প্রোফাইল খুলবে।',
      show: 'কার্ড দেখুন',
      hide: 'লুকান',
      download: 'ডাউনলোড (PNG)',
      loading: 'কার্ড তৈরি হচ্ছে...',
      failed: 'কার্ড তৈরি করা যায়নি।',
      alt: 'আমার UPSAA মেম্বার কার্ড',
    },
  },
  en: {
    memberCard: {
      title: 'Digital Member Card',
      subtitle: 'Your membership card with photo, member ID, batch and a QR code. Scanning it opens your public profile.',
      show: 'Show card',
      hide: 'Hide',
      download: 'Download (PNG)',
      loading: 'Creating your card...',
      failed: 'Could not create the card.',
      alt: 'My UPSAA member card',
    },
  },
};
