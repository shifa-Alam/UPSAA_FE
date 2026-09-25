import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, EMPTY, timer, switchMap } from 'rxjs';
import { AuthService } from '../Services/auth.service';

/** Wait this long after start-up so preloading never competes with the first page. */
const START_AFTER_MS = 2500;

/**
 * Downloads the other pages' code in the background once the app is idle, so a tap on
 * any tab or link opens instantly instead of waiting for its chunk.
 *  - Skipped on data-saver or 2G/slow-2G connections.
 *  - The back office (/dashboard) is only fetched for signed-in staff, so visitors'
 *    phones don't download admin screens they can't open.
 */
@Injectable({ providedIn: 'root' })
export class IdlePreloadStrategy implements PreloadingStrategy {
  private readonly auth = inject(AuthService);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (typeof window === 'undefined' || this.saveData()) return EMPTY;
    if (route.path === 'dashboard' && !(this.auth.isLoggedIn() && this.auth.isStaff())) return EMPTY;
    if (route.path === 'portal' && !this.auth.isLoggedIn()) return EMPTY;
    return timer(START_AFTER_MS).pipe(switchMap(() => this.whenIdle()), switchMap(() => load()));
  }

  private whenIdle(): Observable<void> {
    return new Observable<void>(sub => {
      const done = () => { sub.next(); sub.complete(); };
      const w = window as any;
      const id = w.requestIdleCallback ? w.requestIdleCallback(done, { timeout: 4000 }) : setTimeout(done, 200);
      return () => (w.cancelIdleCallback ? w.cancelIdleCallback(id) : clearTimeout(id));
    });
  }

  private saveData(): boolean {
    const c = (navigator as any).connection;
    return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ''));
  }
}
