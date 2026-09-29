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
  usedThisMonth: number;
  /** Members a notice SMS would reach. */
  audience: number;
}

export interface SmsLogRow {
  id: number;
  createdDate: string;
  kind: 'payment' | 'event' | 'notice' | 'test' | 'birthday';
  phone: string;
  message: string;
  status: 'sent' | 'failed' | 'limit' | 'disabled';
  error: string | null;
  memberName: string | null;
}

/** Staff: automatic SMS switches, the monthly cap, the log, a test SMS. */
@Injectable({ providedIn: 'root' })
export class SmsService {
  private http = inject(HttpClient);
  private url = `${environment.baseUrl}/Sms`;

  status(): Observable<SmsStatus> {
    return this.http.get<SmsStatus>(`${this.url}/Status`);
  }

  save(data: Pick<SmsStatus, 'smsPaymentReceipts' | 'smsEventReminders' | 'smsBirthdayWishes' | 'smsBirthdayMessage' | 'smsMonthlyLimit'>): Observable<SmsStatus> {
    return this.http.put<SmsStatus>(`${this.url}/Settings`, data);
  }

  log(take = 100): Observable<SmsLogRow[]> {
    return this.http.get<SmsLogRow[]>(`${this.url}/Log`, { params: { take } });
  }

  test(phone: string): Observable<{ status: SmsLogRow['status']; error: string | null }> {
    return this.http.post<{ status: SmsLogRow['status']; error: string | null }>(`${this.url}/Test`, { phone });
  }
}
