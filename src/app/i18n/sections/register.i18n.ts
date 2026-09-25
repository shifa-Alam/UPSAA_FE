import { I18nSection } from '../i18n.types';

export const registerI18n: I18nSection = {
  bn: {
    register: {
      pageEyebrow: 'সদস্যপদ',
      pageTitle: 'রেজিস্ট্রেশন ফর্ম',
      pageSubtitle: '“অবশ্যই, সকল তথ্য ইংরেজিতে দিবেন।”',

      requiredNote: 'তারকা (*) চিহ্নিত ঘরগুলো অবশ্যই পূরণ করতে হবে।',

      personal: {
        stepNumber: '১',
        sectionTitle: 'ব্যক্তিগত তথ্য',
        sectionSubtitle: 'অ্যালামনাই ডিরেক্টরির জন্য আপনার প্রাথমিক তথ্য',
        fullName: 'পূর্ণ নাম',
        fullNameRequired: 'পূর্ণ নাম আবশ্যক',
        bloodGroup: 'রক্তের গ্রুপ',
        bloodGroupRequired: 'রক্তের গ্রুপ আবশ্যক',
        email: 'ইমেইল',
        emailRequired: 'সঠিক ইমেইল আবশ্যক',
        phone: 'ফোন নম্বর',
        phoneRequired: 'ফোন নম্বর আবশ্যক',
        gender: 'লিঙ্গ',
        genderSelectOne: 'একটি নির্বাচন করুন',
        genderMale: 'পুরুষ',
        genderFemale: 'মহিলা',
        genderOthers: 'প্রকাশ করতে চাই না',
        batch: 'এসএসসি ব্যাচ (পাশের বছর)',
        selectPlaceholder: '-- নির্বাচন করুন --',
        currentDesignation: 'বর্তমান পদবি',
        employer: 'প্রতিষ্ঠান / কোম্পানি',
        currentCity: 'বর্তমান শহর',
        dob: 'জন্ম তারিখ',
        dobPlaceholder: 'তারিখ নির্বাচন করুন',
        dobHint: '🎉 আমাদের পক্ষ থেকে শুভেচ্ছা পেতে আপনার জন্ম তারিখ জানান!',
      },

      contact: {
        sectionTitle: 'যোগাযোগ ও পেশা',
        sectionSubtitle: 'যোগাযোগের জন্য ফোন ও ইমেইল, আর আপনি এখন কোথায় কী করছেন',
      },

      confirm: {
        sectionTitle: 'সদস্য ফি ও জমা দিন',
        sectionSubtitle: 'ফি দেখে নিন, তারপর যাচাই করে জমা দিন',
      },

      steps: {
        label: 'রেজিস্ট্রেশনের ধাপ',
        personal: 'ব্যক্তিগত',
        contact: 'যোগাযোগ',
        education: 'শিক্ষা',
        confirm: 'জমা দিন',
        next: 'পরের ধাপ',
        back: 'আগের ধাপ',
      },

      education: {
        stepNumber: '২',
        sectionTitle: 'শিক্ষাগত তথ্য',
        sectionSubtitle: 'চলমান বা সম্পন্ন ডিগ্রীগুলো টিক(✔️)দিয়ে উল্লেখ করুন।',
        instituteName: 'প্রতিষ্ঠান / কলেজ / বিশ্ববিদ্যালয়',
        subject: 'বিষয় / গ্রুপ',
      },
      degrees: {
        '1': 'এসএসসি',
        '2': 'এইচএসসি',
        '3': 'ডিপ্লোমা',
        '4': 'স্নাতক',
        '5': 'স্নাতকোত্তর',
        '6': 'পিজিডি',
        '7': 'পিএইচডি',
      },

      fees: {
        stepNumber: '৩',
        sectionTitle: 'সদস্য ফি',
        bkashHeading: 'বিকাশে টাকা পাঠানোর নির্দেশনা :',
        bkashNumberLabel: 'বিকাশ নম্বর:',
        bkashNote: '✅ সেন্ড মানি করার সময় অবশ্যই রেফারেন্স হিসেবে আপনার মোবাইল নাম্বার ব্যবহার করুন, যাতে আপনার আবেদন সঠিকভাবে যাচাই করা যায়।',
        typeHeader: 'ফি এর ধরন',
        amountHeader: 'পরিমাণ (টাকা)',
        donation: 'অনুদান',
        membershipFee: 'সদস্য ফি',
        amountLabel: 'পরিমাণ',
        total: 'মোট',
      },

      verify: {
        stepNumber: '৪',
        sectionTitle: 'যাচাই ও জমা দিন',
        captchaAlt: 'ক্যাপচা',
        captchaLoading: 'লোড হচ্ছে...',
        captchaRefresh: 'ক্যাপচা রিফ্রেশ করুন',
        captchaInputLabel: 'উপরের লেখাটি লিখুন',
        captchaRequired: 'ক্যাপচার উত্তর আবশ্যক',
        submit: 'জমা দিন',
      },

      errors: {
        captchaLoadFailed: 'ক্যাপচা লোড করা যায়নি। পুনরায় চেষ্টা করুন।',
        captchaNotReady: 'ক্যাপচা লোড হওয়া পর্যন্ত অপেক্ষা করুন।',
      },
    },
  },
  en: {
    register: {
      pageEyebrow: 'Membership',
      pageTitle: 'Registration Form',
      pageSubtitle: '"Please provide all information in English."',

      requiredNote: 'Fields marked with an asterisk (*) are required.',

      personal: {
        stepNumber: '1',
        sectionTitle: 'Personal Information',
        sectionSubtitle: 'Your basic information for the alumni directory',
        fullName: 'Full Name',
        fullNameRequired: 'Full name is required',
        bloodGroup: 'Blood Group',
        bloodGroupRequired: 'Blood group is required',
        email: 'Email',
        emailRequired: 'A valid email is required',
        phone: 'Phone Number',
        phoneRequired: 'Phone number is required',
        gender: 'Gender',
        genderSelectOne: 'Select one',
        genderMale: 'Male',
        genderFemale: 'Female',
        genderOthers: 'Prefer not to say',
        batch: 'SSC Batch (Passing Year)',
        selectPlaceholder: '-- Select --',
        currentDesignation: 'Current Designation',
        employer: 'Company / Institution',
        currentCity: 'Current City',
        dob: 'Date of Birth',
        dobPlaceholder: 'Select a date',
        dobHint: '🎉 Let us know your birthday so we can wish you!',
      },

      contact: {
        sectionTitle: 'Contact & work',
        sectionSubtitle: 'How to reach you, and where you are and what you do now',
      },

      confirm: {
        sectionTitle: 'Membership fee & submit',
        sectionSubtitle: 'Check the fee, then verify and submit',
      },

      steps: {
        label: 'Registration steps',
        personal: 'Personal',
        contact: 'Contact',
        education: 'Education',
        confirm: 'Submit',
        next: 'Next',
        back: 'Back',
      },

      education: {
        stepNumber: '2',
        sectionTitle: 'Educational Information',
        sectionSubtitle: 'Tick (✔️) the degrees you have completed or are currently pursuing.',
        instituteName: 'Institute / College / University',
        subject: 'Subject / Group',
      },
      degrees: {
        '1': 'SSC',
        '2': 'HSC',
        '3': 'Diploma',
        '4': "Bachelor's",
        '5': "Master's",
        '6': 'PGD',
        '7': 'PhD',
      },

      fees: {
        stepNumber: '3',
        sectionTitle: 'Membership Fee',
        bkashHeading: 'Instructions for sending money via bKash:',
        bkashNumberLabel: 'bKash Number:',
        bkashNote: '✅ When sending money, please be sure to use your mobile number as the reference, so your application can be verified correctly.',
        typeHeader: 'Fee Type',
        amountHeader: 'Amount (Taka)',
        donation: 'Donation',
        membershipFee: 'Membership Fee',
        amountLabel: 'Amount',
        total: 'Total',
      },

      verify: {
        stepNumber: '4',
        sectionTitle: 'Verification & Submit',
        captchaAlt: 'Captcha',
        captchaLoading: 'Loading...',
        captchaRefresh: 'Refresh captcha',
        captchaInputLabel: 'Type the text shown above',
        captchaRequired: 'Captcha answer is required',
        submit: 'Submit',
      },

      errors: {
        captchaLoadFailed: 'Failed to load captcha. Please try again.',
        captchaNotReady: 'Please wait until the captcha finishes loading.',
      },
    },
  },
};
