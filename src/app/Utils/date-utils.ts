/**
 * Date helpers for values that are a calendar date, not a moment in time
 * (date of birth, ledger entry date, job deadline…).
 *
 * Never send these through toISOString(): it converts local midnight to UTC, so
 * 14 May becomes "13 May 18:00Z" in Bangladesh and the server stores the day before.
 * Send the plain "yyyy-MM-dd" the user picked instead.
 */

/** A Date (e.g. from mat-datepicker) or date string → "yyyy-MM-dd" from its *local* parts. */
export function toDateOnly(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local date as "yyyy-MM-dd" (for <input type="date"> defaults). */
export function todayDateOnly(): string {
  return toDateOnly(new Date())!;
}
