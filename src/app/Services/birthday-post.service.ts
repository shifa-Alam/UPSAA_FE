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
}

export interface FacebookSettingsUpdate {
  enabled: boolean;
  pageId: string | null;
  pageAccessToken?: string | null;
  postTime: string;
}

export interface BirthdayMember {
  memberId: number;
  fullName: string;
  batch: number;
  photo: string | null;
  status: 'Success' | 'Failed' | null;
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

  runNow(): Observable<{ processed: number }> {
    return this.http.post<{ processed: number }>(`${this.apiUrl}/run-now`, {});
  }
}
