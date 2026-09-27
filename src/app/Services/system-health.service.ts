import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'ok' | 'unreachable';
  time: string;
}

/** One line of the server's error diary (C:\UPSAA\Logs) — browser or server. */
export interface ErrorLogEntry {
  at: string;
  kind?: string;
  message?: string;
  stack?: string;
  url?: string;
  status?: number;
  request?: string;
  type?: string;
  user?: string;
  agent?: string;
}

/** SuperAdmin: the API's health and recent errors. */
@Injectable({ providedIn: 'root' })
export class SystemHealthService {
  private http = inject(HttpClient);

  health(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${environment.baseUrl}/health`);
  }

  browserErrors(take = 300): Observable<ErrorLogEntry[]> {
    return this.http.get<ErrorLogEntry[]>(`${environment.baseUrl}/ClientError/recent`, { params: { take } });
  }

  serverErrors(take = 300): Observable<ErrorLogEntry[]> {
    return this.http.get<ErrorLogEntry[]>(`${environment.baseUrl}/ClientError/server`, { params: { take } });
  }
}
