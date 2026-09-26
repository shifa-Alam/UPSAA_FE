import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FacebookSettings {
  enabled: boolean;
  pageId: string | null;
  pageAccessTokenMasked: string | null;
  hasAccessToken: boolean;
  postTime: string;
  emailEnabled: boolean;
  /** False when the server's SMTP settings are incomplete — emails can't go out. */
  emailConfigured: boolean;
}

export interface FacebookSettingsUpdate {
  enabled: boolean;
  pageId: string | null;
  pageAccessToken?: string | null;
  postTime: string;
  emailEnabled: boolean;
}

export interface BirthdayMember {
  memberId: number;
  fullName: string;
  batch: number;
  photo: string | null;
  status: 'Success' | 'Failed' | null;
  hasEmail: boolean;
  emailStatus: 'Success' | 'Failed' | null;
  emailError: string | null;
}

export interface BirthdayPostLog {
  id: number;
  memberId: number;
  memberName: string;
  postDate: string;
  status: 'Success' | 'Failed';
  facebookPostId: string | null;
  errorMessage: string | null;
  createdDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class BirthdayPostService {
  private apiUrl = environment.baseUrl + '/BirthdayPost';

  constructor(private http: HttpClient) { }

  getSettings(): Observable<FacebookSettings> {
    return this.http.get<FacebookSettings>(`${this.apiUrl}/settings`);
  }

  updateSettings(dto: FacebookSettingsUpdate): Observable<FacebookSettings> {
    return this.http.put<FacebookSettings>(`${this.apiUrl}/settings`, dto);
  }

  getTodaysBirthdays(): Observable<BirthdayMember[]> {
    return this.http.get<BirthdayMember[]>(`${this.apiUrl}/today`);
  }

  getLogs(take = 50): Observable<BirthdayPostLog[]> {
    return this.http.get<BirthdayPostLog[]>(`${this.apiUrl}/logs?take=${take}`);
  }

  runNow(): Observable<{ processed: number; emailed: number }> {
    return this.http.post<{ processed: number; emailed: number }>(`${this.apiUrl}/run-now`, {});
  }

  /** The member's birthday photo card (PNG). Staff-only, so fetched as a blob with the auth token. */
  getCard(memberId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/card/${memberId}`, { responseType: 'blob' });
  }

  /** Send (or retry) today's birthday email to one member. */
  sendEmail(memberId: number): Observable<{ result: 'Sent' | 'AlreadySent' }> {
    return this.http.post<{ result: 'Sent' | 'AlreadySent' }>(`${this.apiUrl}/email/${memberId}`, {});
  }
}
