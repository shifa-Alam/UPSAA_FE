import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorLogEntry, HealthStatus, SystemHealthService } from '../../Services/system-health.service';
import { LanguageService } from '../../Services/language.service';
import { environment } from '../../../environments/environment';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';

/** The same error, however many times it happened. */
interface ErrorGroup {
  key: string;
  title: string;
  where: string;
  count: number;
  lastAt: string;
  firstAt: string;
  status?: number;
  samples: ErrorLogEntry[];
}

/**
 * SuperAdmin: is the API up, and what has been going wrong — server exceptions and
 * errors reported by members' browsers (last 7 days), grouped so repeats don't bury
 * the rest.
 */
@Component({
  selector: 'app-error-log',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, AdminHeaderComponent, SectionCardComponent, EmptyStateComponent,
    SkeletonComponent, TranslatePipe],
  templateUrl: './error-log.component.html',
  styleUrl: './error-log.component.scss'
})
export class ErrorLogComponent implements OnInit {
  private api = inject(SystemHealthService);
  private lang = inject(LanguageService);

  readonly healthUrl = `${environment.baseUrl}/health`;

  health: HealthStatus | null = null;
  healthDown = false;
  checkingHealth = false;

  tab: 'server' | 'browser' = 'server';
  loading = true;
  loadError = false;
  entries: ErrorLogEntry[] = [];
  groups: ErrorGroup[] = [];
  filter = '';

  ngOnInit(): void {
    this.checkHealth();
    this.load();
  }

  checkHealth(): void {
    this.checkingHealth = true;
    this.api.health().pipe(catchError(err => of((err?.error as HealthStatus) ?? null))).subscribe(h => {
      this.checkingHealth = false;
      this.health = h;
      this.healthDown = !h || h.status !== 'ok';
    });
  }

  load(): void {
    this.loading = true;
    const req = this.tab === 'server' ? this.api.serverErrors() : this.api.browserErrors();
    req.subscribe({
      next: list => { this.entries = list; this.regroup(); this.loading = false; this.loadError = false; },
      error: () => { this.entries = []; this.groups = []; this.loading = false; this.loadError = true; }
    });
  }

  switchTab(t: 'server' | 'browser'): void {
    if (t === this.tab) return;
    this.tab = t;
    this.load();
  }

  regroup(): void {
    const q = this.filter.trim().toLowerCase();
    const map = new Map<string, ErrorGroup>();
    for (const e of this.entries) {
      const title = this.tab === 'server'
        ? `${(e.type ?? '').split('.').pop() || 'Error'}: ${e.message ?? ''}`
        : e.kind === 'http' ? `HTTP ${e.status ?? '?'} · ${e.request ?? ''}` : (e.message ?? 'Error');
      const where = (this.tab === 'server' ? e.request : e.url) ?? '';
      if (q && !`${title} ${where} ${e.stack ?? ''}`.toLowerCase().includes(q)) continue;
      // Browser errors: same message on different pages is still one problem.
      const key = this.tab === 'server' ? `${title}|${where.replace(/\/\d+(?=\/|$|\?)/g, '/{id}')}` : title;
      const g = map.get(key);
      if (g) {
        g.count++;
        if (e.at < g.firstAt) g.firstAt = e.at;
        if (g.samples.length < 5) g.samples.push(e);
      } else {
        map.set(key, { key, title, where, count: 1, lastAt: e.at, firstAt: e.at, status: e.status, samples: [e] });
      }
    }
    this.groups = [...map.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }

  get last24h(): number {
    const since = Date.now() - 864e5;
    return this.entries.filter(e => new Date(e.at).getTime() > since).length;
  }

  when(value: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(value).toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }
}
