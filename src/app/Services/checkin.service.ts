import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckInPerson {
  memberId: number;
  fullName: string;
  batch: number;
  memberCode: string | null;
  photo: string | null;
}

export interface CheckInAttendee extends CheckInPerson {
  checkedInAt: string;
  /** Said "I'm going" beforehand. */
  rsvp: boolean;
}

export interface CheckInSummary {
  event: { id: number; title: string; eventDate: string; endDate: string | null; venue: string | null };
  /** Check-in is open from the day before the event until the day after it ends. */
  isOpen: boolean;
  goingCount: number;
  checkedInCount: number;
  walkInCount: number;
  attendees: CheckInAttendee[];
  /** Said "I'm going" but haven't arrived yet. */
  notYet: CheckInPerson[];
}

export interface CheckInResult {
  already: boolean;
  checkedInAt: string;
  rsvp: boolean;
  checkedInCount: number;
  member: CheckInPerson & { bloodGroup: string | null };
}

/** Event gate check-in (staff). */
@Injectable({ providedIn: 'root' })
export class CheckInService {
  private http = inject(HttpClient);
  private url = (eventId: number) => `${environment.baseUrl}/Event/${eventId}/CheckIns`;

  summary(eventId: number): Observable<CheckInSummary> {
    return this.http.get<CheckInSummary>(this.url(eventId));
  }

  /** `code` is what the scanner read (the card QR is a profile URL), or a member code / id typed in. */
  checkIn(eventId: number, code: string): Observable<CheckInResult> {
    return this.http.post<CheckInResult>(this.url(eventId), { code });
  }

  undo(eventId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.url(eventId)}/${memberId}`);
  }
}
