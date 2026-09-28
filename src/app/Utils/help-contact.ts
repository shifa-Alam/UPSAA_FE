/**
 * The association's helpline — the same number as the Contact page and footer.
 * Change it here for the help button and the payment guide.
 */
export const HELP_PHONE = '01866293776';

/** For tel: links. */
export const HELP_PHONE_TEL = 'tel:+88' + HELP_PHONE;

export const HELP_WHATSAPP = 'https://wa.me/88' + HELP_PHONE;

/** 01866-293776, or in Bangla digits ০১৮৬৬-২৯৩৭৭৬. */
export function helpPhoneDisplay(lang: string): string {
  const s = `${HELP_PHONE.slice(0, 5)}-${HELP_PHONE.slice(5)}`;
  return lang === 'bn' ? s.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]) : s;
}
