import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notice {
  id: number;
  title: string;
  content: string;
  publishedDate: string;
  createdDate: string;
  createdById: string | null;
  createdByName: string | null;
  alumniOnly: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NoticeService {
  private apiUrl = environment.baseUrl + '/Notice';

  constructor(private http: HttpClient) { }

  /** No login required to call — anonymous callers only get non-alumni-only notices;
   *  any logged-in alumni also gets the alumni-only ones. */
  getAll(): Observable<Notice[]> {
    return this.http.get<Notice[]>(`${this.apiUrl}/GetAll`);
  }

  /** SuperAdmin/Admin only. publishedDate omitted defaults to now. */
  create(title: string, content: string, publishedDate?: string | null, alumniOnly = false): Observable<Notice> {
    return this.http.post<Notice>(`${this.apiUrl}/Create`, { title, content, publishedDate, alumniOnly });
  }

  /** SuperAdmin/Admin only. publishedDate omitted leaves the existing value unchanged. */
  update(id: number, title: string, content: string, publishedDate?: string | null, alumniOnly = false): Observable<Notice> {
    return this.http.put<Notice>(`${this.apiUrl}/${id}`, { title, content, publishedDate, alumniOnly });
  }

  /** SuperAdmin/Admin only. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
