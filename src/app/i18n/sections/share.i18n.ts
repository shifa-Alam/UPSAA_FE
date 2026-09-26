import { I18nSection } from '../i18n.types';

/** Share / add-to-calendar menu (shared/share-menu) and the event countdown (shared/countdown). */
export const shareI18n: I18nSection = {
  bn: {
    share: {
      share: 'শেয়ার',
      facebook: 'Facebook-এ শেয়ার',
      whatsapp: 'WhatsApp-এ পাঠান',
      copyLink: 'লিংক কপি করুন',
      copied: 'লিংক কপি হয়েছে।',
      copyFailed: 'লিংক কপি করা যায়নি।',
      addToCalendar: 'ক্যালেন্ডারে যোগ',
      googleCalendar: 'Google Calendar',
      icsFile: 'Apple / Outlook (.ics)',
    },
    countdown: {
      label: 'ইভেন্ট শুরু হতে বাকি সময়',
      startsIn: 'শুরু হতে বাকি',
      days: 'দিন',
      hours: 'ঘণ্টা',
      minutes: 'মিনিট',
      seconds: 'সেকেন্ড',
    },
  },
  en: {
    share: {
      share: 'Share',
      facebook: 'Share on Facebook',
      whatsapp: 'Send on WhatsApp',
      copyLink: 'Copy link',
      copied: 'Link copied.',
      copyFailed: 'Could not copy the link.',
      addToCalendar: 'Add to calendar',
      googleCalendar: 'Google Calendar',
      icsFile: 'Apple / Outlook (.ics)',
    },
    countdown: {
      label: 'Time until the event starts',
      startsIn: 'Starts in',
      days: 'days',
      hours: 'hrs',
      minutes: 'min',
      seconds: 'sec',
    },
  },
};
