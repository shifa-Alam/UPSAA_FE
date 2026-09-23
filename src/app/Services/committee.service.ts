import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, concat, distinctUntilChanged, map, of, tap, throwError, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CommitteeMember {
  memberName: string;
  photo: string | null;
  batch?: number | null;
  votes: number;
  /** Only present for SuperAdmin (preview / editor). */
  memberId?: number | null;
}

export interface CommitteePosition {
  positionId: number;
  positionName: string;
  priority: number;
  members: CommitteeMember[];
}

export interface Committee {
  electionId: number;
  electionTitle: string;
  electionDate: string;
  positions: CommitteePosition[];
  /** Set for a published committee; null while the page falls back to the live vote count. */
  committeeId: number | null;
  termLabel: string | null;
  termStart: string | null;
  termEnd: string | null;
  isCurrent: boolean;
  isPublished: boolean;
}

export interface CommitteeSummary {
  id: number;
  termLabel: string;
  termStart: string | null;
  termEnd: string | null;
  isCurrent: boolean;
  memberCount: number;
  electionId: number | null;
  electionTitle: string | null;
  publishedAt: string;
  publishedByName: string | null;
}

export interface CommitteeSeat {
  memberId: number | null;
  memberName: string;
  batch: number | null;
  positionName: string;
  positionPriority: number;
  sortOrder: number;
  votes: number | null;
}

export interface PublishCommittee {
  electionId: number;
  termLabel: string;
  termStart: string | null;
  termEnd: string | null;
  makeCurrent: boolean;
}

export interface UpdateCommittee {
  termLabel: string;
  termStart: string | null;
  termEnd: string | null;
  members: CommitteeSeat[];
}

/** Bump when the Committee shape changes so an old saved copy is ignored. */
const CACHE_KEY = 'upsaa-committee-current-v1';

@Injectable({ providedIn: 'root' })
export class CommitteeService {
  private apiUrl = environment.baseUrl + '/Committee';

  constructor(private http: HttpClient) { }

  /**
   * The current committee, stale-while-revalidate: the last copy this browser saw is
   * emitted immediately (so the page appears at once, even on a slow phone
   * connection), then the fresh copy from the API — only if it actually differs.
   * Errors surface only when there was nothing saved to show.
   */
  current(): Observable<Committee> {
    const cached = this.readCache();
    const fresh$ = this.http.get<Committee>(`${this.apiUrl}/Current`).pipe(
      // An API deployed before the Committee endpoints existed answers 404 here; the
      // old live-count endpoint keeps the page working until the backend is updated.
      catchError(err => err?.status === 404 ? this.legacyCurrent() : throwError(() => err)),
      tap(c => this.writeCache(c))
    );

    if (!cached) return fresh$;

    return concat(of(cached), fresh$.pipe(catchError(() => EMPTY))).pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );
  }

  private legacyCurrent(): Observable<Committee> {
    return this.http.get<Omit<Committee, 'committeeId' | 'termLabel' | 'termStart' | 'termEnd' | 'isCurrent' | 'isPublished'>>(
      `${environment.baseUrl}/Vote/PublicCommittee`
    ).pipe(map(c => ({ ...c, committeeId: null, termLabel: null, termStart: null, termEnd: null, isCurrent: true, isPublished: false })));
  }

  history(): Observable<CommitteeSummary[]> {
    return this.http.get<CommitteeSummary[]>(`${this.apiUrl}/History`);
  }

  get(id: number): Observable<Committee> {
    return this.http.get<Committee>(`${this.apiUrl}/${id}`);
  }

  // ---- SuperAdmin ----

  adminList(): Observable<CommitteeSummary[]> {
    return this.http.get<CommitteeSummary[]>(`${this.apiUrl}/Admin/List`);
  }

  preview(electionId: number): Observable<Committee> {
    return this.http.get<Committee>(`${this.apiUrl}/Preview/${electionId}`);
  }

  publish(body: PublishCommittee): Observable<number> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/Publish`, body).pipe(
      tap(() => this.clearCache()),
      map(r => r.id)
    );
  }

  update(id: number, body: UpdateCommittee): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, body).pipe(tap(() => this.clearCache()));
  }

  makeCurrent(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/MakeCurrent`, {}).pipe(tap(() => this.clearCache()));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(tap(() => this.clearCache()));
  }

  // ---- browser cache (a per-device convenience; failures are harmless) ----

  private readCache(): Committee | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && Array.isArray(parsed.positions) ? parsed as Committee : null;
    } catch {
      return null;
    }
  }

  private writeCache(c: Committee): void {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* storage full or disabled */ }
  }

  /** After a SuperAdmin change, this browser shouldn't show the old committee even briefly. */
  private clearCache(): void {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
  }
}
