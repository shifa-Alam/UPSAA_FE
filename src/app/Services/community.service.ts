import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListPage, listParams, toListPage } from './list-page';

/** Name, batch and photo of the member behind a post. */
export interface MemberBrief {
  id: number;
  fullName: string;
  batch: number;
  photo: string | null;
}

export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';

// ---------------------------------------------------------------- blood requests

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

export interface BloodRequest {
  id: number;
  bloodGroup: string;
  units: number;
  patientName: string | null;
  hospital: string;
  city: string | null;
  neededBy: string;
  contactPhone: string;
  note: string | null;
  status: 'Open' | 'Fulfilled' | 'Cancelled';
  createdDate: string;
  requester: MemberBrief;
  responseCount: number;
  iResponded: boolean;
  isMine: boolean;
  canIDonate: boolean;
}

export interface BloodRequestSave {
  bloodGroup: string;
  units: number;
  patientName: string;
  hospital: string;
  city: string;
  /** Local date-time "yyyy-MM-ddTHH:mm" (Bangladesh time). */
  neededBy: string;
  contactPhone: string;
  note: string;
}

export interface BloodResponder {
  member: MemberBrief;
  phone: string | null;
  bloodGroup: string | null;
  respondedAt: string;
}

// ---------------------------------------------------------------- memories

export interface Memory {
  id: number;
  story: string;
  year: number | null;
  photoUrl: string | null;
  status: ModerationStatus;
  reviewNote: string | null;
  createdDate: string;
  member: MemberBrief;
  rememberCount: number;
  iRemember: boolean;
  isMine: boolean;
}

// ---------------------------------------------------------------- businesses

export interface Business {
  id: number;
  name: string;
  category: string;
  description: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  alumniOffer: string | null;
  logoUrl: string | null;
  status: ModerationStatus;
  reviewNote: string | null;
  createdDate: string;
  owner: MemberBrief;
  isMine: boolean;
}

export interface BusinessSave {
  name: string;
  category: string;
  description: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  alumniOffer: string;
}

export interface FilterCount { name: string; count: number; }

export interface CityCount { city: string; count: number; }

export interface PendingCounts { achievements: number; memories: number; businesses: number; }

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly api = environment.baseUrl;

  constructor(private http: HttpClient) { }

  // ---- blood requests (members only) ----
  bloodRequests(includeClosed = false): Observable<BloodRequest[]> {
    return this.http.get<BloodRequest[]>(`${this.api}/BloodRequest`, { params: listParams({ includeClosed, take: 50 }) });
  }

  bloodRequest(id: number): Observable<BloodRequest> {
    return this.http.get<BloodRequest>(`${this.api}/BloodRequest/${id}`);
  }

  createBloodRequest(dto: BloodRequestSave): Observable<BloodRequest> {
    return this.http.post<BloodRequest>(`${this.api}/BloodRequest`, dto);
  }

  respondToBloodRequest(id: number): Observable<{ responded: boolean; count: number }> {
    return this.http.post<{ responded: boolean; count: number }>(`${this.api}/BloodRequest/${id}/respond`, {});
  }

  bloodResponders(id: number): Observable<BloodResponder[]> {
    return this.http.get<BloodResponder[]>(`${this.api}/BloodRequest/${id}/responders`);
  }

  setBloodRequestStatus(id: number, status: 'Fulfilled' | 'Cancelled'): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.api}/BloodRequest/${id}/status`, { status });
  }

  // ---- memory wall ----
  memories(query: { skip?: number; take?: number }): Observable<ListPage<Memory>> {
    return this.http.get<Memory[]>(`${this.api}/Memory`, { params: listParams(query), observe: 'response' }).pipe(map(toListPage));
  }

  myMemories(): Observable<Memory[]> {
    return this.http.get<Memory[]>(`${this.api}/Memory/Mine`);
  }

  shareMemory(story: string, year: number | null, file: File | null): Observable<Memory> {
    const form = new FormData();
    form.append('Story', story);
    if (year) form.append('Year', String(year));
    if (file) form.append('File', file);
    return this.http.post<Memory>(`${this.api}/Memory`, form);
  }

  remember(id: number): Observable<{ remembered: boolean; count: number }> {
    return this.http.post<{ remembered: boolean; count: number }>(`${this.api}/Memory/${id}/Remember`, {});
  }

  deleteMemory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/Memory/${id}`);
  }

  // ---- business directory ----
  businesses(query: { category?: string; city?: string; search?: string; skip?: number; take?: number }): Observable<ListPage<Business>> {
    return this.http.get<Business[]>(`${this.api}/Business`, { params: listParams(query), observe: 'response' }).pipe(map(toListPage));
  }

  businessFilters(): Observable<{ categories: FilterCount[]; cities: FilterCount[] }> {
    return this.http.get<{ categories: FilterCount[]; cities: FilterCount[] }>(`${this.api}/Business/Filters`);
  }

  myBusinesses(): Observable<Business[]> {
    return this.http.get<Business[]>(`${this.api}/Business/Mine`);
  }

  saveBusiness(dto: BusinessSave, file: File | null, id?: number): Observable<Business> {
    const form = new FormData();
    for (const [k, v] of Object.entries(dto)) form.append(k.charAt(0).toUpperCase() + k.slice(1), v ?? '');
    if (file) form.append('File', file);
    return id
      ? this.http.put<Business>(`${this.api}/Business/${id}`, form)
      : this.http.post<Business>(`${this.api}/Business`, form);
  }

  deleteBusiness(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/Business/${id}`);
  }

  // ---- moderation (staff) ----
  pendingCounts(): Observable<PendingCounts> {
    return this.http.get<PendingCounts>(`${this.api}/Community/PendingCounts`);
  }

  pendingMemories(): Observable<Memory[]> {
    return this.http.get<Memory[]>(`${this.api}/Memory/Pending`);
  }

  pendingBusinesses(): Observable<Business[]> {
    return this.http.get<Business[]>(`${this.api}/Business/Pending`);
  }

  /** kind: 'Memory' | 'Business' | 'Achievement' — each controller has the same approve/reject pair. */
  review(kind: 'Memory' | 'Business' | 'Achievement', id: number, approve: boolean, note?: string): Observable<unknown> {
    return approve
      ? this.http.post(`${this.api}/${kind}/${id}/Approve`, {})
      : this.http.post(`${this.api}/${kind}/${id}/Reject`, { note: note ?? null });
  }

  // ---- alumni map ----
  cities(): Observable<CityCount[]> {
    return this.http.get<CityCount[]>(`${this.api}/Community/Cities`);
  }
}
