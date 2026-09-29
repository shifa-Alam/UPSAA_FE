import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SmsStatus {
  /** SmsSettings:EnableSms on the server — when false nothing is sent at all. */
  gatewayEnabled: boolean;
  smsPaymentReceipts: boolean;
  smsEventReminders: boolean;
  /** A wish SMS at midnight to the member whose birthday it is. */
  smsBirthdayWishes: boolean;
  smsBirthdayMessage: string;
  defaultBirthdayMessage: string;
  smsMonthlyLimit: number;
  /** Bangladesh time of day, minutes after midnight (480 = 8:00 AM). */
  birthdaySmsMinute: number;
  /** The day before an event, minutes after midnight (540 = 9:00 AM). */
  eventReminderMinute: number;
  usedThisMonth: number;
  /** Members a notice SMS would reach. */
  audience: number;
}

export interface SmsLogRow {
  id: number;
  createdDate: string;
  kind: 'payment' | 'event' | 'notice' | 'test' | 'birthday' | 'manual';
  phone: string;
  message: string;
  status: 'sent' | 'failed' | 'limit' | 'disabled';
  error: string | null;
  memberName: string | null;
}

/** Who a hand-written SMS goes to. */
export interface SmsAudience {
  target: 'all' | 'batch' | 'members' | 'phone';
  batch?: number | null;
  memberIds?: number[];
  phone?: string;
}

/** A notice/event row's SMS so far (from the log). */
export interface SmsItemStatus {
  sent: number;
  failed: number;
  last: string | null;
  /** Set for later and still waiting (Bangladesh time). */
  scheduledAt?: string | null;
}

/** An SMS set for later that hasn't gone yet. */
export interface ScheduledSms {
  id: number;
  kind: 'manual' | 'notice' | 'event';
  itemId: number | null;
  sendAt: string;
  /** The typed message, or the notice/event title. */
  text: string | null;
  audience: SmsAudience | null;
}

/** "Now" or a Bangladesh date-time ("2026-09-30T10:00"). */
export type SmsWhen = string | null;

/** Minutes after midnight ↔ "HH:mm" for time inputs. */
export function minutesToTime(m: number): string {
  const h = Math.floor((m ?? 0) / 60), mm = (m ?? 0) % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
export function timeToMinutes(v: string): number {
  const [h, m] = (v || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export type SmsItemKind = 'notice' | 'event';

/** SMS parts a message takes: Bangla (Unicode) 70 / 67 per part, plain English 160 / 153. */
export function smsParts(text: string): number {
  if (!text) return 0;
  const unicode = /[^\x00-\x7F]/.test(text);
  const [single, multi] = unicode ? [70, 67] : [160, 153];
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
}

/** Staff: automatic SMS switches, the monthly cap, the log, a test SMS. */
@Injectable({ providedIn: 'root' })
export class SmsService {
  private http = inject(HttpClient);
  private url = `${environment.baseUrl}/Sms`;

  status(): Observable<SmsStatus> {
    return this.http.get<SmsStatus>(`${this.url}/Status`);
  }

  save(data: Pick<SmsStatus, 'smsPaymentReceipts' | 'smsEventReminders' | 'smsBirthdayWishes' | 'smsBirthdayMessage' | 'smsMonthlyLimit'>
    & Partial<Pick<SmsStatus, 'birthdaySmsMinute' | 'eventReminderMinute'>>): Observable<SmsStatus> {
    return this.http.put<SmsStatus>(`${this.url}/Settings`, data);
  }

  log(take = 100): Observable<SmsLogRow[]> {
    return this.http.get<SmsLogRow[]>(`${this.url}/Log`, { params: { take } });
  }

  test(phone: string): Observable<{ status: SmsLogRow['status']; error: string | null }> {
    return this.http.post<{ status: SmsLogRow['status']; error: string | null }>(`${this.url}/Test`, { phone });
  }

  /** How many people a hand-written SMS would reach, and SMS left this month. */
  audience(a: SmsAudience): Observable<{ count: number; left: number }> {
    return this.http.post<{ count: number; left: number }>(`${this.url}/Audience`, a);
  }

  /** Now, or at `when` (Bangladesh time) — then the reply has `scheduled`. */
  send(a: SmsAudience, message: string, when: SmsWhen = null): Observable<{ queued?: number; scheduled?: number; sendAt?: string }> {
    return this.http.post<{ queued?: number; scheduled?: number; sendAt?: string }>(`${this.url}/Send`, { ...a, message, sendAt: when });
  }

  /** A notice/event to every active member. 409 when it already went, unless again. */
  sendItem(kind: SmsItemKind, id: number, again = false, when: SmsWhen = null): Observable<{ queued?: number; scheduled?: number; sendAt?: string }> {
    return this.http.post<{ queued?: number; scheduled?: number; sendAt?: string }>(`${this.url}/Item/${kind}/${id}`,
      { sendAt: when }, { params: again ? { again: true } : {} });
  }

  scheduled(): Observable<ScheduledSms[]> {
    return this.http.get<ScheduledSms[]>(`${this.url}/Scheduled`);
  }

  cancelScheduled(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/Scheduled/${id}`);
  }

  /** Birthday screen: the wish to one member now (edited text, or the Settings › SMS wording). */
  birthday(memberId: number, message?: string, again = false): Observable<{ queued: number; text: string }> {
    return this.http.post<{ queued: number; text: string }>(`${this.url}/Birthday/${memberId}`,
      { message: message ?? null }, { params: again ? { again: true } : {} });
  }

  birthdayStatus(ids: number[]): Observable<Record<number, { status: 'sent' | 'failed' | 'limit' | 'disabled'; error: string | null; at: string }>> {
    return this.http.get<Record<number, { status: 'sent' | 'failed' | 'limit' | 'disabled'; error: string | null; at: string }>>(
      `${this.url}/BirthdayStatus`, { params: { ids: ids.join(',') } });
  }

  itemStatus(kind: SmsItemKind, ids: number[]): Observable<Record<number, SmsItemStatus>> {
    return this.http.get<Record<number, SmsItemStatus>>(`${this.url}/ItemStatus`, { params: { kind, ids: ids.join(',') } });
  }
}
