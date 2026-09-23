import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListPage, listParams, toListPage } from './list-page';

export type TeacherStatus = 'Current' | 'Former' | 'Retired';

export interface Teacher {
  id: number;
  fullName: string;
  designation: string | null;
  subject: string | null;
  status: TeacherStatus;
  serviceStartYear: number | null;
  serviceEndYear: number | null;
  message: string | null;
  photoUrl: string | null;
  createdDate: string;
  createdById: string | null;
  createdByName: string | null;
}

export interface TeacherSave {
  fullName: string;
  designation: string;
  subject: string;
  status: TeacherStatus;
  serviceStartYear: number | null;
  serviceEndYear: number | null;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private apiUrl = environment.baseUrl + '/Teacher';

  constructor(private http: HttpClient) { }

  /** Public — no login required. */
  getAll(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.apiUrl}/GetAll`);
  }

  /** A page of the list plus the total count — for previews and "load more" lists. */
  getPage(query: { skip?: number; take?: number }): Observable<ListPage<Teacher>> {
    return this.http.get<Teacher[]>(`${this.apiUrl}/GetAll`, { params: listParams(query), observe: 'response' })
      .pipe(map(res => toListPage(res)));
  }

  /** SuperAdmin/Admin only. */
  create(data: TeacherSave, file?: File | null): Observable<Teacher> {
    return this.http.post<Teacher>(`${this.apiUrl}/Create`, this.toFormData(data, file));
  }

  /** SuperAdmin/Admin only. Pass a file to replace the photo; omit to keep the existing one. */
  update(id: number, data: TeacherSave, file?: File | null): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.apiUrl}/${id}`, this.toFormData(data, file));
  }

  /** SuperAdmin/Admin only. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toFormData(data: TeacherSave, file?: File | null): FormData {
    const formData = new FormData();
    formData.append('FullName', data.fullName);
    formData.append('Designation', data.designation);
    formData.append('Subject', data.subject);
    formData.append('Status', data.status);
    if (data.serviceStartYear != null) formData.append('ServiceStartYear', String(data.serviceStartYear));
    if (data.serviceEndYear != null) formData.append('ServiceEndYear', String(data.serviceEndYear));
    formData.append('Message', data.message);
    if (file) formData.append('File', file);
    return formData;
  }
}
