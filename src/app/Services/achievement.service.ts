import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListPage, listParams, toListPage } from './list-page';

export interface Achievement {
  id: number;
  fullName: string;
  batch: number | null;
  profession: string | null;
  organization: string | null;
  title: string;
  description: string | null;
  photoUrl: string | null;
  createdDate: string;
  createdById: string | null;
  createdByName: string | null;
}

export interface AchievementSave {
  fullName: string;
  batch: number | null;
  profession: string;
  organization: string;
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private apiUrl = environment.baseUrl + '/Achievement';

  constructor(private http: HttpClient) { }

  /** Public — no login required. */
  getAll(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/GetAll`);
  }

  /** A page of the list plus the total count — for previews and "load more" lists. */
  getPage(query: { skip?: number; take?: number }): Observable<ListPage<Achievement>> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/GetAll`, { params: listParams(query), observe: 'response' })
      .pipe(map(res => toListPage(res)));
  }

  /** SuperAdmin/Admin only. */
  create(data: AchievementSave, file?: File | null): Observable<Achievement> {
    return this.http.post<Achievement>(`${this.apiUrl}/Create`, this.toFormData(data, file));
  }

  /** SuperAdmin/Admin only. Pass a file to replace the photo; omit to keep the existing one. */
  update(id: number, data: AchievementSave, file?: File | null): Observable<Achievement> {
    return this.http.put<Achievement>(`${this.apiUrl}/${id}`, this.toFormData(data, file));
  }

  /** SuperAdmin/Admin only. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toFormData(data: AchievementSave, file?: File | null): FormData {
    const formData = new FormData();
    formData.append('FullName', data.fullName);
    if (data.batch != null) formData.append('Batch', String(data.batch));
    formData.append('Profession', data.profession);
    formData.append('Organization', data.organization);
    formData.append('Title', data.title);
    formData.append('Description', data.description);
    if (file) formData.append('File', file);
    return formData;
  }
}
