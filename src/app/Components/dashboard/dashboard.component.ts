import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { NavIconComponent } from '../shared/nav-icon/nav-icon.component';
import { MenuGroup, menuFor } from './shell-menus';
import { AuthService } from '../../Services/auth.service';
import { ThemeService } from '../../Services/theme.service';
import { LanguageService } from '../../Services/language.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, CommonModule, TranslatePipe, NavIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  collapsed = false;
  activeRoute = '';
  /** Collapsed rail: the group whose pages are showing in the flyout, and where. */
  flyout: { item: MenuGroup; top: number; left: number } | null = null;

  /** Which sidebar this instance renders — set per route via `data.shell`.
   *  'admin' = back office at /dashboard, 'member' = alumni portal at /portal. */
  shell: 'admin' | 'member' = 'admin';
  homeRoute = '/dashboard/home';
  menuItems: MenuGroup[] = [];

  private static readonly COLLAPSED_KEY = 'dashboard.collapsed';

  constructor(
    private router: Router,
    route: ActivatedRoute,
    public auth: AuthService,
    public theme: ThemeService,
    public lang: LanguageService
  ) {
    this.shell = route.snapshot.data['shell'] === 'member' ? 'member' : 'admin';
    this.homeRoute = this.shell === 'member' ? '/portal/home' : '/dashboard/home';
    // Shared with the phone drawer (shell-menus.ts); a fresh copy per instance.
    this.menuItems = menuFor(this.shell, auth.getCurrentUser()?.role ?? '');

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.activeRoute = event.urlAfterRedirects.split('?')[0];
        this.openActiveGroup();
      }
    });
    this.restoreCollapsed();
    this.activeRoute = router.url.split('?')[0];
    this.openActiveGroup();
  }

  get currentUser() {
    return this.auth.getCurrentUser();
  }

  get userInitial(): string {
    const email = this.currentUser?.email;
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  get roleLabelKey(): string {
    switch (this.currentUser?.role) {
      case 'SuperAdmin': return 'dashboard.roleSuperAdmin';
      case 'Admin': return 'dashboard.roleAdmin';
      default: return 'dashboard.roleMember';
    }
  }

  toggleMenu(item: MenuGroup) {
    this.menuItems.forEach(i => {
      if (i !== item) i.expanded = false;
    });
    item.expanded = !item.expanded;
  }

  /** Expanded: open/close the group inline. Collapsed: the inline list is hidden, so show
   *  the group's pages in a flyout beside the icon instead. */
  onGroupClick(item: MenuGroup, event: MouseEvent) {
    if (!this.collapsed) {
      this.toggleMenu(item);
      return;
    }
    if (this.flyout?.item === item) {
      this.flyout = null;
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // Keep the flyout on screen for groups near the bottom of the rail.
    const estimatedHeight = 44 + item.children.length * 42;
    const top = Math.max(8, Math.min(rect.top, window.innerHeight - estimatedHeight - 8));
    this.flyout = { item, top, left: rect.right + 8 };
  }

  isGroupActive(item: MenuGroup): boolean {
    return item.children.some(c => c.route === this.activeRoute);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.flyout) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.flyout, .menu-item.parent')) return;
    this.flyout = null;
  }

  @HostListener('document:keydown.escape')
  @HostListener('window:resize')
  closeFlyout() {
    this.flyout = null;
  }

  navigate(route: string) {
    this.flyout = null;
    if (this.activeRoute === route) return;
    this.activeRoute = route;
    this.router.navigateByUrl(route);
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    this.flyout = null;
    this.persistCollapsed();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /** Whichever group owns the current route opens itself — including on a
   *  hard refresh or deep link, where there is no click to react to. */
  private openActiveGroup(): void {
    const group = this.menuItems.find(g => g.children.some(c => c.route === this.activeRoute));
    if (group && !group.expanded) {
      this.menuItems.forEach(i => i.expanded = false);
      group.expanded = true;
    }
  }

  private persistCollapsed(): void {
    try {
      localStorage.setItem(DashboardComponent.COLLAPSED_KEY, this.collapsed ? '1' : '0');
    } catch { /* private mode / quota — the rail still works, it just forgets */ }
  }

  private restoreCollapsed(): void {
    try {
      this.collapsed = localStorage.getItem(DashboardComponent.COLLAPSED_KEY) === '1';
    } catch { /* same as above */ }
  }
}
