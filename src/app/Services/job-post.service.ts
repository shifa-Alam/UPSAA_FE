import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type JobType = 'FullTime' | 'PartTime' | 'Internship' | 'Contract';

export interface JobPost {
  id: number;
  title: string;
  companyName: string;
  location: string | null;
  jobType: JobType;
  description: string;
  applyInfo: string;
  deadline: string | null;
  createdDate: string;
  postedById: string | null;
  postedByName: string | null;
  canManage: boolean;
}

export interface JobPostSave {
  title: string;
  companyName: string;
  location: string;
  jobType: JobType;
  description: string;
  applyInfo: string;
  deadline: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class JobPostService {
  private apiUrl = environment.baseUrl + '/JobPost';

  constructor(private http: HttpClient) { }

  /** Alumni-only — requires login (any role). */
  getAll(): Observable<JobPost[]> {
    return this.http.get<JobPost[]>(`${this.apiUrl}/GetAll`);
  }

  /** Any logged-in alumni can post. */
  create(data: JobPostSave): Observable<JobPost> {
    return this.http.post<JobPost>(`${this.apiUrl}/Create`, data);
  }

  /** Original poster or Admin/SuperAdmin only — enforced server-side too. */
  update(id: number, data: JobPostSave): Observable<JobPost> {
    return this.http.put<JobPost>(`${this.apiUrl}/${id}`, data);
  }

  /** Original poster or Admin/SuperAdmin only — enforced server-side too. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
