import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListPage, listParams, toListPage } from './list-page';

export interface GalleryImage {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  createdDate: string;
  createdById: string | null;
  createdByName: string | null;
  eventId: number | null;
  eventTitle: string | null;
}

/** Keep in sync with GalleryController's limits. */
export const GALLERY_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const GALLERY_MAX_FILES_PER_UPLOAD = 20;

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private apiUrl = environment.baseUrl + '/Gallery';

  constructor(private http: HttpClient) { }

  /** Public — no login required. */
  getAll(category?: string, eventId?: number): Observable<GalleryImage[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (eventId) params.set('eventId', String(eventId));
    const query = params.toString() ? `?${params}` : '';
    return this.http.get<GalleryImage[]>(`${this.apiUrl}/GetAll${query}`);
  }

  /** A page of the list plus the total count — for previews and "load more" lists. */
  getPage(query: { skip?: number; take?: number; category?: string; eventId?: number }): Observable<ListPage<GalleryImage>> {
    return this.http.get<GalleryImage[]>(`${this.apiUrl}/GetAll`, { params: listParams(query), observe: 'response' })
      .pipe(map(res => toListPage(res)));
  }

  /** Public — no login required. */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/Categories`);
  }

  /** SuperAdmin/Admin only. */
  upload(file: File, title: string, category: string, eventId?: number | null): Observable<GalleryImage> {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('Title', title);
    formData.append('Category', category);
    if (eventId) formData.append('EventId', String(eventId));
    return this.http.post<GalleryImage>(`${this.apiUrl}/Upload`, formData);
  }

  /** SuperAdmin/Admin only. Uploads all files under one Title/Category — one gallery entry per file. */
  uploadMultiple(files: File[], title: string, category: string, eventId?: number | null): Observable<GalleryImage[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('Files', file));
    formData.append('Title', title);
    formData.append('Category', category);
    if (eventId) formData.append('EventId', String(eventId));
    return this.http.post<GalleryImage[]>(`${this.apiUrl}/UploadMultiple`, formData);
  }

  /** SuperAdmin/Admin only. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** SuperAdmin/Admin only. Pass a file to replace the photo; omit to only change the details.
   *  eventId is replaced as-is — null unlinks the photo from its event. */
  update(id: number, title: string, category: string, eventId: number | null, file?: File | null): Observable<GalleryImage> {
    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Category', category);
    if (eventId) formData.append('EventId', String(eventId));
    if (file) {
      formData.append('File', file);
    }
    return this.http.put<GalleryImage>(`${this.apiUrl}/${id}`, formData);
  }
}
