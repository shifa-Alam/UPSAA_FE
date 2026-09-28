import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** The API sends enums by name (JsonStringEnumConverter in Program.cs), so these are string enums. */
export enum PaymentPurpose { Membership = 'Membership', Annual = 'Annual', Donation = 'Donation' }
/** Cash is only ever entered by the treasurer ("record a payment"). */
export enum PaymentMethod { Bkash = 'Bkash', Nagad = 'Nagad', Rocket = 'Rocket', Cash = 'Cash' }
export enum PaymentStatus { Pending = 'Pending', Approved = 'Approved', Rejected = 'Rejected' }

export interface PaymentSettings {
  bkashNumber: string | null;
  nagadNumber: string | null;
  rocketNumber: string | null;
  instructions: string | null;
  membershipFee: number;
  annualFee: number;
  /** The signed-in member still owes the one-time membership fee. */
  membershipDue?: boolean;
}

export interface Payment {
  id: number;
  receiptNo: string;
  memberId: number;
  memberName: string;
  memberCode: string | null;
  batch: number;
  memberPhone: string | null;
  purpose: PaymentPurpose;
  amount: number;
  method: PaymentMethod;
  senderNumber: string;
  transactionId: string;
  note: string | null;
  status: PaymentStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  reviewedByName: string | null;
  campaignId?: number | null;
  campaignTitle?: string | null;
  showDonorName?: boolean;
  /** Only whoever approved/rejected it may undo that decision. */
  canUndo?: boolean;
}

export interface PaymentSubmit {
  purpose: PaymentPurpose;
  amount: number;
  method: PaymentMethod;
  senderNumber: string;
  transactionId: string;
  note?: string;
  /** A donation towards this campaign. */
  campaignId?: number | null;
  /** List my name (and batch, never the amount) on the campaign page. */
  showDonorName?: boolean;
}

/** Staff entering a payment for a member (cash, or a TrxID told on the phone). */
export interface PaymentRecord {
  memberId: number;
  purpose: PaymentPurpose;
  amount: number;
  method: PaymentMethod;
  senderNumber?: string;
  transactionId?: string;
  campaignId?: number | null;
  showDonorName?: boolean;
  note?: string;
}

export interface MemberLookup {
  id: number;
  fullName: string;
  memberCode: string | null;
  batch: number;
  phone: string;
  membershipDue: boolean;
}

export interface PaymentList {
  items: Payment[];
  pending: number;
  approved: number;
  rejected: number;
}

export const METHOD_NAMES: Record<PaymentMethod, string> = {
  [PaymentMethod.Bkash]: 'bKash',
  [PaymentMethod.Nagad]: 'Nagad',
  [PaymentMethod.Rocket]: 'Rocket',
  [PaymentMethod.Cash]: 'Cash',
};

/** Dues and donations by mobile banking "Send Money" + transaction ID, verified by the treasurer. */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private url = `${environment.baseUrl}/Payment`;

  settings(): Observable<PaymentSettings> {
    return this.http.get<PaymentSettings>(`${this.url}/Settings`);
  }

  submit(data: PaymentSubmit): Observable<Payment> {
    return this.http.post<Payment>(this.url, data);
  }

  mine(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.url}/Mine`);
  }

  // ---- staff
  list(status?: PaymentStatus): Observable<PaymentList> {
    return this.http.get<PaymentList>(this.url, { params: status ? { status } : {} });
  }

  approve(id: number, note?: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.url}/${id}/Approve`, { note: note ?? null });
  }

  reject(id: number, note: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.url}/${id}/Reject`, { note });
  }

  /** Staff: a payment made in cash or told on the phone — booked straight away. */
  record(data: PaymentRecord): Observable<Payment> {
    return this.http.post<Payment>(`${this.url}/Record`, data);
  }

  /** Staff: find a member by name, member code or phone. */
  lookup(q: string): Observable<MemberLookup[]> {
    return this.http.get<MemberLookup[]>(`${this.url}/MemberLookup`, { params: { q } });
  }

  /** Back to pending: an approval's ledger entry is removed and its fee becomes unpaid again. */
  undo(id: number): Observable<Payment> {
    return this.http.post<Payment>(`${this.url}/${id}/Undo`, {});
  }

  saveSettings(data: PaymentSettings): Observable<PaymentSettings> {
    return this.http.put<PaymentSettings>(`${this.url}/Settings`, data);
  }
}
