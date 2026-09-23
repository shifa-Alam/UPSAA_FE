import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { NavIconComponent, NavIconName } from '../shared/nav-icon/nav-icon.component';
import { AuthService } from '../../Services/auth.service';
import { ThemeService } from '../../Services/theme.service';
import { LanguageService } from '../../Services/language.service';

interface MenuChild {
  labelKey: string;
  route: string;
  icon: NavIconName;
}

interface MenuGroup {
  labelKey: string;
  icon: NavIconName;
  expanded: boolean;
  children: MenuChild[];
}

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

  menuItems: MenuGroup[] = [
    {
      labelKey: 'dashboard.menuMembers',
      icon: 'users',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemMembers', route: '/dashboard/members', icon: 'users' }
      ]
    },
    {
      labelKey: 'dashboard.menuElectionPanel',
      icon: 'layers',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemElections', route: '/dashboard/elections', icon: 'calendar' },
        { labelKey: 'dashboard.itemPositions', route: '/dashboard/positions', icon: 'tag' },
        { labelKey: 'dashboard.itemCandidates', route: '/dashboard/candidates', icon: 'user-check' },
        { labelKey: 'dashboard.itemVoteHistory', route: '/dashboard/vote-casts', icon: 'clock' }
      ]
    },
    {
      labelKey: 'dashboard.menuContent',
      icon: 'folder',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemGallery', route: '/dashboard/gallery', icon: 'image' },
        { labelKey: 'dashboard.itemNotices', route: '/dashboard/notices', icon: 'megaphone' },
        { labelKey: 'dashboard.itemBirthdayAutomation', route: '/dashboard/birthday-automation', icon: 'gift' },
        { labelKey: 'dashboard.itemAchievements', route: '/dashboard/achievements', icon: 'award' },
        { labelKey: 'dashboard.itemTeachers', route: '/dashboard/teachers', icon: 'graduation-cap' },
        { labelKey: 'dashboard.itemEvents', route: '/dashboard/events', icon: 'calendar' }
      ]
    },
    {
      labelKey: 'dashboard.menuFinance',
      icon: 'dollar',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemFinance', route: '/dashboard/finance', icon: 'dollar' }
      ]
    },
    {
      // These are the same alumni-only pages logged-in members reach from the
      // public site's "Community" nav dropdown — that dropdown lives in the
      // top toolbar, which is hidden while inside /dashboard, so staff need a
      // way in from here too. Routes are absolute (outside /dashboard) on purpose.
      labelKey: 'dashboard.menuCommunity',
      icon: 'briefcase',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemJobBoard', route: '/jobs', icon: 'briefcase' },
        { labelKey: 'dashboard.itemBloodDonors', route: '/blood-donors', icon: 'droplet' },
        { labelKey: 'dashboard.itemConstitutionLink', route: '/constitution', icon: 'book' }
      ]
    }
  ];

  private static readonly COLLAPSED_KEY = 'dashboard.collapsed';

  constructor(
    private router: Router,
    public auth: AuthService,
    public theme: ThemeService,
    public lang: LanguageService
  ) {
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
    return this.currentUser?.role === 'SuperAdmin' ? 'dashboard.roleSuperAdmin' : 'dashboard.roleAdmin';
  }

  toggleMenu(item: MenuGroup) {
    this.menuItems.forEach(i => {
      if (i !== item) i.expanded = false;
    });
    item.expanded = !item.expanded;
  }

  navigate(route: string) {
    if (this.activeRoute === route) return;
    this.activeRoute = route;
    this.router.navigateByUrl(route);
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
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
