import { I18nSection } from '../i18n.types';

export const directoryI18n: I18nSection = {
  bn: {
    directory: {
      hero: {
        eyebrow: 'সদস্য তালিকা',
        title: 'অ্যালামনাই ডিরেক্টরি',
        subtitle: 'উত্তরণ পাবলিক স্কুল অ্যালামনাই অ্যাসোসিয়েশনের সক্রিয় নিবন্ধিত সদস্যদের তালিকা।',
      },
      filters: {
        namePlaceholder: 'নাম দিয়ে খুঁজুন',
        professionPlaceholder: 'পেশা বা প্রতিষ্ঠান (যেমনঃ ডাক্তার)',
        allBloodGroups: 'সকল রক্তের গ্রুপ',
        cityPlaceholder: 'শহর দিয়ে খুঁজুন',
        batchPlaceholder: 'ব্যাচ (যেমনঃ ২০১৫)',
        reset: 'রিসেট',
      },
      loading: 'তথ্য লোড হচ্ছে...',
      errorTitle: 'তালিকা লোড করা যায়নি',
      errorMessage: 'কিছুক্ষণ পর আবার চেষ্টা করুন।',
      emptyTitle: 'কোনো সদস্য পাওয়া যায়নি',
      emptyMessage: 'ভিন্ন নাম, পেশা, ব্যাচ, শহর বা রক্তের গ্রুপ দিয়ে খুঁজে দেখুন।',
      meta: {
        totalPrefix: 'মোট',
        activeMembers: 'জন সক্রিয় সদস্য',
        page: 'পৃষ্ঠা',
      },
      batchPrefix: 'ব্যাচ',
      pagination: {
        prev: 'পূর্ববর্তী',
        next: 'পরবর্তী',
        label: 'পৃষ্ঠা পরিবর্তন',
      },
      cta: {
        title: 'তালিকায় আপনার নাম নেই?',
        body: 'অ্যালামনাই হিসেবে নিবন্ধন করুন — পুরোনো সহপাঠীরা আপনাকে খুঁজে পাবে এখানেই।',
        join: 'অ্যালামনাইতে যুক্ত হোন',
        batches: 'ব্যাচভিত্তিক তালিকা',
      },
    },
  },
  en: {
    directory: {
      hero: {
        eyebrow: 'Member List',
        title: 'Alumni Directory',
        subtitle: 'A list of active, registered members of the Uttaran Public School Alumni Association.',
      },
      filters: {
        namePlaceholder: 'Search by name',
        professionPlaceholder: 'Profession or employer (e.g. doctor)',
        allBloodGroups: 'All Blood Groups',
        cityPlaceholder: 'Search by city',
        batchPlaceholder: 'Batch (e.g. 2015)',
        reset: 'Reset',
      },
      loading: 'Loading data...',
      errorTitle: 'List Could Not Be Loaded',
      errorMessage: 'Please try again shortly.',
      emptyTitle: 'No Members Found',
      emptyMessage: 'Try searching with a different name, profession, batch, city or blood group.',
      meta: {
        totalPrefix: 'Total',
        activeMembers: 'active members',
        page: 'Page',
      },
      batchPrefix: 'Batch',
      pagination: {
        prev: 'Previous',
        next: 'Next',
        label: 'Pagination',
      },
      cta: {
        title: 'Not in the Directory Yet?',
        body: 'Register as an alumnus so your old classmates can find you right here.',
        join: 'Join the Alumni',
        batches: 'Browse by Batch',
      },
    },
  },
};
