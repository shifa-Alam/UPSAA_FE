import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListPage, listParams, toListPage } from './list-page';

export interface EventItem {
  id: number;
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  venue: string | null;
  organizerName: string | null;
  photoUrl: string | null;
  registrationUrl: string | null;
  createdDate: string;
  createdById: string | null;
  createdByName: string | null;
  /** Gallery photos linked to this event. */
  galleryPhotoCount: number;
}

export interface EventSave {
  title: string;
  description: string;
  eventDate: string;
  endDate: string | null;
  venue: string;
  organizerName: string;
  registrationUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = environment.baseUrl + '/Event';

  constructor(private http: HttpClient) { }

  /** Public — no login required. */
  getAll(): Observable<EventItem[]> {
    return this.http.get<EventItem[]>(`${this.apiUrl}/GetAll`);
  }

  /** A page of the list plus the total count — for previews and "load more" lists. */
  getPage(query: { skip?: number; take?: number; when?: 'upcoming' | 'past' }): Observable<ListPage<EventItem>> {
    return this.http.get<EventItem[]>(`${this.apiUrl}/GetAll`, { params: listParams(query), observe: 'response' })
      .pipe(map(res => toListPage(res)));
  }

  /** SuperAdmin/Admin only. */
  create(data: EventSave, file?: File | null): Observable<EventItem> {
    return this.http.post<EventItem>(`${this.apiUrl}/Create`, this.toFormData(data, file));
  }

  /** SuperAdmin/Admin only. Pass a file to replace the cover photo; omit to keep the existing one. */
  update(id: number, data: EventSave, file?: File | null): Observable<EventItem> {
    return this.http.put<EventItem>(`${this.apiUrl}/${id}`, this.toFormData(data, file));
  }

  /** SuperAdmin/Admin only. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toFormData(data: EventSave, file?: File | null): FormData {
    const formData = new FormData();
    formData.append('Title', data.title);
    formData.append('Description', data.description);
    formData.append('EventDate', data.eventDate);
    if (data.endDate) formData.append('EndDate', data.endDate);
    formData.append('Venue', data.venue);
    formData.append('OrganizerName', data.organizerName);
    formData.append('RegistrationUrl', data.registrationUrl);
    if (file) formData.append('File', file);
    return formData;
  }
}
