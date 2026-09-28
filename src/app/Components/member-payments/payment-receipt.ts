import { METHOD_NAMES, Payment, PaymentMethod, PaymentPurpose } from '../../Services/payment.service';
import { LanguageService } from '../../Services/language.service';

const esc = (s: string | number | null | undefined) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Prints (or saves as PDF, from the print dialog) a receipt for an approved payment.
 * A hidden iframe holds a one-page document, so the app's own layout never ends up
 * on the paper.
 */
export function printReceipt(p: Payment, lang: LanguageService): void {
  const t = (key: string) => lang.translate(`payments.receipt.${key}`);
  const locale = lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  const money = '৳' + new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(p.amount);
  const when = new Date(p.reviewedAt ?? p.submittedAt).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' });
  const purpose = lang.translate(p.purpose === PaymentPurpose.Membership ? 'payments.purposeMembership'
    : p.purpose === PaymentPurpose.Annual ? 'payments.purposeAnnual' : 'payments.purposeDonation');

  const rows: [string, string][] = [
    [t('member'), `${p.memberName}${p.memberCode ? ` (${p.memberCode})` : ''}`],
    [t('batch'), new Intl.NumberFormat(locale, { useGrouping: false }).format(p.batch)],
    [t('purpose'), purpose],
    [t('method'), p.method === PaymentMethod.Cash ? t('cash') : `${METHOD_NAMES[p.method]}${p.senderNumber ? ' · ' + p.senderNumber : ''}`],
    ...(p.method === PaymentMethod.Cash ? [] : [[t('trx'), p.transactionId] as [string, string]]),
    [t('date'), when],
  ];

  const html = `<!DOCTYPE html><html lang="${lang.lang()}"><head><meta charset="utf-8"><title>${esc(p.receiptNo)}</title>
<style>
  @page { size: A5; margin: 14mm; }
  body { font-family: 'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif; color: #0f172a; margin: 0; }
  .r { border: 2px solid #0a2a5e; border-radius: 14px; padding: 22px 24px; }
  .h { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #c9a24a; padding-bottom: 14px; }
  .h img { width: 56px; height: 56px; }
  .h b { display: block; font-size: 20px; color: #0a2a5e; }
  .h small { color: #475569; }
  .title { display: flex; justify-content: space-between; align-items: baseline; margin: 18px 0 10px; }
  .title h1 { font-size: 18px; margin: 0; letter-spacing: .04em; text-transform: uppercase; }
  .title span { font-family: ui-monospace, monospace; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 7px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  td:first-child { color: #475569; width: 38%; }
  .amt { margin: 18px 0 6px; padding: 14px; border-radius: 10px; background: #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
  .amt b { font-size: 26px; color: #0a2a5e; }
  .ok { color: #2e7d32; font-weight: 700; }
  .f { margin-top: 18px; font-size: 12px; color: #64748b; text-align: center; }
</style></head><body><div class="r">
  <div class="h"><img src="${esc(location.origin)}/logo.png" alt="">
    <div><b>UPSAA</b><small>Uttaran Public School Alumni Association</small></div></div>
  <div class="title"><h1>${esc(t('title'))}</h1><span>${esc(p.receiptNo)}</span></div>
  <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
  <div class="amt"><span class="ok">✓ ${esc(t('verified'))}</span><b>${esc(money)}</b></div>
  <p class="f">${esc(t('footer'))}</p>
</div></body></html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  const print = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  // Wait for the logo so it isn't missing from the printout.
  const img = doc.querySelector('img');
  if (img && !img.complete) {
    img.addEventListener('load', print, { once: true });
    img.addEventListener('error', print, { once: true });
  } else {
    setTimeout(print, 50);
  }
}
