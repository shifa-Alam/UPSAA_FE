import { I18nSection } from '../i18n.types';

export const changePasswordI18n: I18nSection = {
  bn: {
    changePassword: {
      forcedHint: 'আপনি একটি অস্থায়ী পাসওয়ার্ড দিয়ে লগইন করেছেন। নিরাপত্তার জন্য এখনই নিজের একটি নতুন পাসওয়ার্ড দিন — SMS-এ পাওয়া পাসওয়ার্ডটি "বর্তমান পাসওয়ার্ড" ঘরে লিখুন।',
      title: 'পাসওয়ার্ড পরিবর্তন করুন',
      hint: 'পরিবর্তনের পর আপনাকে লগ আউট করা হবে; নতুন পাসওয়ার্ড দিয়ে আবার লগ ইন করুন।',
      currentPassword: 'বর্তমান পাসওয়ার্ড',
      newPassword: 'নতুন পাসওয়ার্ড',
      confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
      cancel: 'বাতিল',
      saving: 'সংরক্ষণ করা হচ্ছে...',
      submit: 'পাসওয়ার্ড পরিবর্তন করুন',
      errors: {
        passwordsDoNotMatch: 'নতুন পাসওয়ার্ড দুটি মিলছে না।',
        success: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।',
        changeFailed: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।',
      },
    },
  },
  en: {
    changePassword: {
      forcedHint: 'You signed in with a temporary password. For your security, choose your own now — enter the one from the SMS as your current password.',
      title: 'Change Password',
      hint: 'You will be signed out afterwards — sign in again with your new password.',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      cancel: 'Cancel',
      saving: 'Saving...',
      submit: 'Change Password',
      errors: {
        passwordsDoNotMatch: 'The new passwords do not match.',
        success: 'Password changed successfully.',
        changeFailed: 'Failed to change password.',
      },
    },
  },
};
