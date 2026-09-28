import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Campaign {
  id: number;
  title: string;
  description: string | null;
  goalAmount: number;
  /** Bangladesh dates. No end date = open until closed. */
  startDate: string;
  endDate: string | null;
  isPublished: boolean;
  isOpen: boolean;
  /** Approved online donations + cash the treasurer recorded. */
  raised: number;
  onlineAmount: number;
  offlineAmount: number;
  donorCount: number;
  /** Staff only. */
  pendingCount: number | null;
}

export interface CampaignDonor {
  name: string;
  batch: number;
  at: string;
}

export interface CampaignDetail {
  campaign: Campaign;
  /** Donors who agreed to be listed — name and batch, never amounts. */
  donors: CampaignDonor[];
  anonymousDonorCount: number;
}

export interface CampaignSave {
  title: string;
  description: string | null;
  goalAmount: number;
  startDate: string;
  endDate: string | null;
  isPublished: boolean;
  offlineAmount: number;
}

/** Fundraising campaigns — public progress, staff management. */
@Injectable({ providedIn: 'root' })
export class CampaignService {
  private http = inject(HttpClient);
  private url = `${environment.baseUrl}/Campaign`;

  list(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(this.url);
  }

  get(id: number): Observable<CampaignDetail> {
    return this.http.get<CampaignDetail>(`${this.url}/${id}`);
  }

  // ---- staff
  all(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.url}/All`);
  }

  create(data: CampaignSave): Observable<Campaign> {
    return this.http.post<Campaign>(this.url, data);
  }

  update(id: number, data: CampaignSave): Observable<Campaign> {
    return this.http.put<Campaign>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

/** 0–100, capped (a campaign can pass its goal; the bar stops at full). */
export function campaignPercent(c: Pick<Campaign, 'raised' | 'goalAmount'>): number {
  return c.goalAmount > 0 ? Math.min(100, Math.round((c.raised / c.goalAmount) * 100)) : 0;
}

/** Whole days left until the end date (Bangladesh), or null when open-ended / over. */
export function campaignDaysLeft(c: Pick<Campaign, 'endDate' | 'isOpen'>): number | null {
  if (!c.endDate || !c.isOpen) return null;
  const end = new Date(c.endDate.slice(0, 10) + 'T23:59:59+06:00').getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 864e5));
}
