import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MonthCollections {
  /** yyyy-MM (Bangladesh). */
  month: string;
  membership: number;
  annual: number;
  donation: number;
}

export interface EventTurnout {
  id: number;
  title: string;
  eventDate: string;
  going: number;
  arrived: number;
  walkIns: number;
}

export interface ReportOverview {
  activeMembers: number;
  newThisMonth: number;
  membershipPaid: number;
  membershipDue: number;
  pendingPayments: number;
  collectedThisMonth: number;
  collectedInPeriod: number;
  openCampaigns: number;
  collections: MonthCollections[];
  events: EventTurnout[];
}

export type ExportKind = 'Members' | 'Ledger' | 'Payments';

/** Staff reports and CSV (Excel) exports. */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private url = `${environment.baseUrl}/Report`;

  overview(months = 12): Observable<ReportOverview> {
    return this.http.get<ReportOverview>(`${this.url}/Overview`, { params: { months } });
  }

  /** Fetches with the login token, then saves the file under the server's name. */
  download(kind: ExportKind, range?: { from?: string; to?: string }): Observable<void> {
    const params: Record<string, string> = {};
    if (range?.from) params['from'] = range.from;
    if (range?.to) params['to'] = range.to;
    return this.save(this.http.get(`${this.url}/${kind}.csv`, { params, responseType: 'blob', observe: 'response' }), `UPSAA-${kind}.csv`);
  }

  downloadAttendance(eventId: number): Observable<void> {
    return this.save(this.http.get(`${this.url}/EventAttendance/${eventId}.csv`, { responseType: 'blob', observe: 'response' }),
      `UPSAA-event-${eventId}-attendance.csv`);
  }

  private save(req: Observable<HttpResponse<Blob>>, fallbackName: string): Observable<void> {
    return req.pipe(map(res => {
      const name = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(res.headers.get('Content-Disposition') ?? '')?.[1];
      const a = document.createElement('a');
      a.href = URL.createObjectURL(res.body!);
      a.download = name ? decodeURIComponent(name) : fallbackName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }));
  }
}
