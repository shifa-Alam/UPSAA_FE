import { ErrorHandler, Injectable, NgZone, PLATFORM_ID, inject, isDevMode } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/** At most this many reports per page load, and each distinct message only once. */
const MAX_REPORTS = 20;

/**
 * Sends the errors people hit on their phones to the API (POST /api/ClientError), so they
 * show up in the server's error log instead of vanishing. Uses HttpBackend — no
 * interceptors — so a failing report can never trigger another report.
 */
@Injectable({ providedIn: 'root' })
export class ErrorReporterService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly sent = new Set<string>();

  report(entry: { kind: 'error' | 'http'; message: string; stack?: string; status?: number; request?: string }): void {
    if (!this.isBrowser || isDevMode()) return; // local dev server: the console is enough
    const key = `${entry.kind}|${entry.status ?? ''}|${entry.message}`.slice(0, 300);
    if (this.sent.has(key) || this.sent.size >= MAX_REPORTS) return;
    this.sent.add(key);
    this.zone.runOutsideAngular(() =>
      this.http.post(`${environment.baseUrl}/ClientError`, { ...entry, url: location.href }).subscribe({ error: () => { /* offline — drop it */ } })
    );
  }
}

/** Uncaught errors anywhere in the app. */
@Injectable()
export class ReportingErrorHandler implements ErrorHandler {
  private readonly reporter = inject(ErrorReporterService);

  handleError(error: unknown): void {
    console.error(error);
    const err = (error as any)?.rejection ?? error; // unwrap promise rejections
    if (err instanceof HttpErrorResponse) return;    // reported by the interceptor below
    this.reporter.report({
      kind: 'error',
      message: String(err?.message ?? err).slice(0, 1000),
      stack: typeof err?.stack === 'string' ? err.stack.slice(0, 4000) : undefined,
    });
  }
}

/** Server errors (5xx) from our API — offline/aborted requests (status 0) and 4xx are normal. */
export const errorReportInterceptor: HttpInterceptorFn = (req, next) => {
  const reporter = inject(ErrorReporterService);
  return next(req).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status >= 500) {
        reporter.report({
          kind: 'http',
          status: err.status,
          message: (err.error?.message ?? err.message ?? '').toString().slice(0, 1000),
          request: `${req.method} ${req.url.replace(environment.baseUrl, '')}`.slice(0, 300),
        });
      }
      return throwError(() => err);
    })
  );
};
