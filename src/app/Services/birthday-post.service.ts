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
  /** New notices / events start with "also post on the Facebook page" ticked. */
  autoPostNotices: boolean;
  autoPostEvents: boolean;
  /** Posted as they go public (approved / published / created). */
  autoPostAchievements: boolean;
  autoPostMemories: boolean;
  autoPostBusinesses: boolean;
  autoPostJobs: boolean;
  autoPostCampaigns: boolean;
  autoPostBloodRequests: boolean;
  /** False when the server's SMTP settings are incomplete — emails can't go out. */
  emailConfigured: boolean;
  /** The address mail goes out from (set in the server config), and the SMTP server. */
  emailFromAddress: string | null;
  emailServer: string | null;
  /** The sender name in effect (saved, or the default), and the default. */
  emailFromName: string;
  defaultEmailFromName: string;
  /** Wording in effect (saved, or the default). Placeholders: {name} {batch} {position} {card}. */
  emailSubject: string;
  emailBody: string;
  defaultEmailSubject: string;
  defaultEmailBody: string;
  /** The Facebook birthday post's message in effect (saved, or the default). Placeholders: {name} {batch} {position}. */
  postMessage: string;
  defaultPostMessage: string;
}

/** A partial update — leave a field out to keep its saved value. */
export interface FacebookSettingsUpdate {
  enabled?: boolean;
  /** Blank = clear it. */
  pageId?: string | null;
  /** Blank = keep the saved token. */
  pageAccessToken?: string | null;
  postTime?: string;
  emailEnabled?: boolean;
  autoPostNotices?: boolean;
  autoPostEvents?: boolean;
  autoPostAchievements?: boolean;
  autoPostMemories?: boolean;
  autoPostBusinesses?: boolean;
  autoPostJobs?: boolean;
  autoPostCampaigns?: boolean;
  autoPostBloodRequests?: boolean;
  /** Blank or identical to the default = use the built-in wording. */
  emailSubject?: string;
  emailBody?: string;
  /** Blank or identical to the default = the built-in message; omitted = unchanged. */
  postMessage?: string;
  /** Blank or the default = the built-in sender name; omitted = unchanged. */
  emailFromName?: string;
}

export interface BirthdayMember {
  memberId: number;
  fullName: string;
  batch: number;
  photo: string | null;
  status: 'Success' | 'Failed' | null;
  hasEmail: boolean;
  /** The wish the automatic post would use — the starting text for a manual post. */
  wishText: string;
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

  updateSettings(dto: Partial<FacebookSettingsUpdate>): Observable<FacebookSettings> {
    return this.http.put<FacebookSettings>(`${this.apiUrl}/settings`, dto);
  }

  /** Birthdays on a day ("yyyy-MM-dd"; omitted = today), with that day's post/email status. */
  getTodaysBirthdays(date?: string): Observable<BirthdayMember[]> {
    return this.http.get<BirthdayMember[]>(`${this.apiUrl}/today`, { params: date ? { date } : {} });
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

  /** The card as it would be posted, with a picture chosen for it (PNG). */
  previewCard(memberId: number, photo: File | null): Observable<Blob> {
    const form = new FormData();
    if (photo) form.append('photo', photo);
    return this.http.post(`${this.apiUrl}/card/${memberId}/preview`, form, { responseType: 'blob' });
  }

  /**
   * Post a reviewed birthday wish now: the admin's wording (blank = the usual one) and optionally a
   * picture — on the card, or (photoAsIs) posted instead of the card. 409 = already posted (use force).
   */
  postManual(memberId: number, options: { caption: string; photo: File | null; photoAsIs: boolean; force: boolean; date: string }):
    Observable<{ postId: string | null }> {
    const form = new FormData();
    form.append('caption', options.caption);
    if (options.photo) form.append('photo', options.photo);
    form.append('photoAsIs', String(options.photoAsIs && !!options.photo));
    form.append('force', String(options.force));
    form.append('date', options.date);
    return this.http.post<{ postId: string | null }>(`${this.apiUrl}/post/${memberId}`, form);
  }

  /** Send a test email (blank "to" = the signed-in admin), optionally trying an unsaved sender name. */
  sendTestEmail(to: string, fromName: string): Observable<{ to: string }> {
    return this.http.post<{ to: string }>(`${this.apiUrl}/test-email`, { to, fromName });
  }

  /** Send (or retry) today's birthday email to one member. */
  sendEmail(memberId: number): Observable<{ result: 'Sent' | 'AlreadySent' }> {
    return this.http.post<{ result: 'Sent' | 'AlreadySent' }>(`${this.apiUrl}/email/${memberId}`, {});
  }
}
