import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../Services/auth.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

interface Tab {
  icon: string;
  label: string;
  link: string;
  /** Only the exact URL counts as active (for the home tabs, whose URL prefixes others). */
  exact?: boolean;
}

/** Full-screen flows where a tab bar would only get in the way. */
const HIDDEN_ON = ['/login', '/register', '/forgot-password', '/reset-password', '/election', '/votecard', '/nomination'];

/**
 * Phone-only tab bar (≤768px), like a native app: the four places people go most,
 * plus "More", which opens the full side menu. The tabs follow who is signed in —
 * visitors get the public site, alumni their portal, staff the back office.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, TranslatePipe],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  /** Opens the side menu (owned by the app shell). */
  @Output() more = new EventEmitter<void>();

  private user = toSignal(this.auth.user$, { initialValue: null });
  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly hidden = computed(() => {
    const path = this.url().split('?')[0];
    return HIDDEN_ON.some(p => path === p || path.startsWith(p + '/'));
  });

  readonly tabs = computed<Tab[]>(() => {
    this.user(); // recompute on login/logout
    if (!this.auth.isLoggedIn()) {
      return [
        { icon: 'home', label: 'pwa.tabs.home', link: '/', exact: true },
        { icon: 'campaign', label: 'pwa.tabs.notices', link: '/notices' },
        { icon: 'event', label: 'pwa.tabs.events', link: '/events' },
        { icon: 'groups', label: 'pwa.tabs.directory', link: '/members' },
      ];
    }
    if (this.auth.isStaff()) {
      return [
        { icon: 'dashboard', label: 'pwa.tabs.dashboard', link: '/dashboard/home' },
        { icon: 'groups', label: 'pwa.tabs.members', link: '/dashboard/members' },
        { icon: 'campaign', label: 'pwa.tabs.notices', link: '/dashboard/notices' },
        { icon: 'event', label: 'pwa.tabs.events', link: '/dashboard/events' },
      ];
    }
    return [
      { icon: 'home', label: 'pwa.tabs.home', link: '/portal/home' },
      { icon: 'campaign', label: 'pwa.tabs.notices', link: '/portal/notices' },
      { icon: 'event', label: 'pwa.tabs.events', link: '/portal/events' },
      { icon: 'groups', label: 'pwa.tabs.directory', link: '/portal/members' },
    ];
  });

  /** A light tap on phones that support it — the "click" of a native tab bar. */
  tap(): void {
    try { navigator.vibrate?.(8); } catch { /* not supported */ }
  }
}
