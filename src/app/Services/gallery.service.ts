import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GalleryImage {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  createdDate: string;
  createdById: string | null;
  createdByName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private apiUrl = environment.baseUrl + '/Gallery';

  constructor(private http: HttpClient) { }

  /** Public — no login required. */
  getAll(category?: string): Observable<GalleryImage[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.http.get<GalleryImage[]>(`${this.apiUrl}/GetAll${query}`);
  }

  /** Public — no login required. */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/Categories`);
  }

  /** SuperAdmin/Admin only. */
  upload(file: File, title: string, category: string): Observable<GalleryImage> {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('Title', title);
    formData.append('Category', category);
    return this.http.post<GalleryImage>(`${this.apiUrl}/Upload`, formData);
  }

  /** SuperAdmin/Admin only. Uploads all files under one Title/Category — one gallery entry per file. */
  uploadMultiple(files: File[], title: string, category: string): Observable<GalleryImage[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('Files', file));
    formData.append('Title', title);
    formData.append('Category', category);
    return this.http.post<GalleryImage[]>(`${this.apiUrl}/UploadMultiple`, formData);
  }

  /** SuperAdmin/Admin only. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** SuperAdmin/Admin only. Pass a file to replace the photo; omit to only change title/category. */
  update(id: number, title: string, category: string, file?: File | null): Observable<GalleryImage> {
    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Category', category);
    if (file) {
      formData.append('File', file);
    }
    return this.http.put<GalleryImage>(`${this.apiUrl}/${id}`, formData);
  }
}
