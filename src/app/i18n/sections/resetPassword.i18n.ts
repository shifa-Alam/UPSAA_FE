import { I18nSection } from '../i18n.types';

export const resetPasswordI18n: I18nSection = {
  bn: {
    resetPassword: {
      brand: {
        eyebrow: 'উত্তরণ পাবলিক স্কুল অ্যালামনাই অ্যাসোসিয়েশন',
        title: 'আর মাত্র এক ধাপ',
        tagline: 'একটি স্কুল। অনেক প্রজন্ম। একটি পরিবার।',
      },
      title: 'আপনার পাসওয়ার্ড পরিবর্তন করুন',
      subtitle: 'আপনার অ্যালামনাই অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড দিন।',
      backToLogin: 'লগইন পেজে ফিরে যান',
      newPasswordPlaceholder: 'নতুন পাসওয়ার্ড',
      changePassword: 'পাসওয়ার্ড পরিবর্তন করুন',
      errors: {
        passwordRequired: 'নতুন পাসওয়ার্ড লিখুন।',
        success: '✅ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! এখন আপনি লগইন করতে পারেন।',
        invalidOrExpiredLink: '❌ লিংকটি অবৈধ অথবা মেয়াদোত্তীর্ণ।',
      },
    },
  },
  en: {
    resetPassword: {
      brand: {
        eyebrow: 'Uttaran Public School Alumni Association',
        title: 'Just one more step',
        tagline: 'One School. Many Generations. One Community.',
      },
      title: 'Change your password',
      subtitle: 'Enter a new password for your alumni account.',
      backToLogin: 'Back to login',
      newPasswordPlaceholder: 'New password',
      changePassword: 'Change Password',
      errors: {
        passwordRequired: 'Please enter a new password.',
        success: '✅ Password changed successfully! You can now log in.',
        invalidOrExpiredLink: '❌ This link is invalid or has expired.',
      },
    },
  },
};
