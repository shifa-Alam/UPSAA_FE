import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListPage, listParams, toListPage } from './list-page';

/** An alumni quote for the homepage "Alumni Voices" slider. */
export interface Testimonial {
  id: number;
  fullName: string;
  batch: number | null;
  profession: string | null;
  quote: string;
  photoUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdDate: string;
}

export interface TestimonialSave {
  fullName: string;
  batch: number | null;
  profession: string;
  quote: string;
  isPublished: boolean;
  sortOrder: number;
}

/** Keep in sync with TestimonialController.MaxQuoteLength on the API. */
export const MAX_QUOTE_LENGTH = 600;

@Injectable({
  providedIn: 'root'
})
export class TestimonialService {
  private apiUrl = environment.baseUrl + '/Testimonial';

  constructor(private http: HttpClient) { }

  /** Public — published quotes only, in display order. */
  getPage(query: { skip?: number; take?: number }): Observable<ListPage<Testimonial>> {
    return this.http.get<Testimonial[]>(`${this.apiUrl}/GetAll`, { params: listParams(query), observe: 'response' })
      .pipe(map(res => toListPage(res)));
  }

  /** SuperAdmin/Admin — drafts included. */
  getAllForAdmin(): Observable<Testimonial[]> {
    return this.http.get<Testimonial[]>(`${this.apiUrl}/Admin`);
  }

  create(data: TestimonialSave, file?: File | null): Observable<Testimonial> {
    return this.http.post<Testimonial>(`${this.apiUrl}/Create`, this.toFormData(data, file));
  }

  update(id: number, data: TestimonialSave, file?: File | null): Observable<Testimonial> {
    return this.http.put<Testimonial>(`${this.apiUrl}/${id}`, this.toFormData(data, file));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toFormData(data: TestimonialSave, file?: File | null): FormData {
    const formData = new FormData();
    formData.append('FullName', data.fullName);
    if (data.batch != null) formData.append('Batch', String(data.batch));
    formData.append('Profession', data.profession);
    formData.append('Quote', data.quote);
    formData.append('IsPublished', String(data.isPublished));
    formData.append('SortOrder', String(data.sortOrder ?? 0));
    if (file) formData.append('File', file);
    return formData;
  }
}
