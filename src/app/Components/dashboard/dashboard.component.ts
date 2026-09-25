import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { NavIconComponent, NavIconName } from '../shared/nav-icon/nav-icon.component';
import { AuthService } from '../../Services/auth.service';
import { ThemeService } from '../../Services/theme.service';
import { LanguageService } from '../../Services/language.service';

interface MenuChild {
  labelKey: string;
  route: string;
  icon: NavIconName;
  /** Only these roles see the item; omitted = everyone in this shell. */
  roles?: string[];
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

  /** Which sidebar this instance renders — set per route via `data.shell`.
   *  'admin' = back office at /dashboard, 'member' = alumni portal at /portal. */
  shell: 'admin' | 'member' = 'admin';
  homeRoute = '/dashboard/home';
  menuItems: MenuGroup[] = [];

  private static readonly ADMIN_MENU: MenuGroup[] = [
    {
      labelKey: 'dashboard.menuMembers',
      icon: 'users',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemMembers', route: '/dashboard/members', icon: 'users' },
        { labelKey: 'userRoles.menu', route: '/dashboard/user-roles', icon: 'user-check', roles: ['SuperAdmin'] }
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
        { labelKey: 'dashboard.itemVoteHistory', route: '/dashboard/vote-casts', icon: 'clock' },
        { labelKey: 'committeeAdmin.menu', route: '/dashboard/committee', icon: 'award', roles: ['SuperAdmin'] }
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
      // Constitution is managed here (upload/replace); jobs and blood donors are the
      // member community pages, shown inside the shell (see shellRedirectGuard).
      labelKey: 'dashboard.menuCommunity',
      icon: 'briefcase',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemJobBoard', route: '/dashboard/jobs', icon: 'briefcase' },
        { labelKey: 'dashboard.itemBloodDonors', route: '/dashboard/blood-donors', icon: 'droplet' },
        { labelKey: 'dashboard.itemConstitutionLink', route: '/dashboard/constitution', icon: 'book' }
      ]
    }
  ];

  // Member portal. Everything renders inside the shell — members never see the
  // public site (see shellRedirectGuard).
  private static readonly MEMBER_MENU: MenuGroup[] = [
    {
      labelKey: 'dashboard.menuMyAccount',
      icon: 'users',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemMyProfile', route: '/portal/profile', icon: 'user-check' }
      ]
    },
    {
      labelKey: 'dashboard.menuAlumni',
      icon: 'layers',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemDirectory', route: '/portal/members', icon: 'users' },
        { labelKey: 'dashboard.itemBatches', route: '/portal/batches', icon: 'graduation-cap' },
        { labelKey: 'dashboard.itemAchievements', route: '/portal/achievements', icon: 'award' },
        { labelKey: 'dashboard.itemTeachers', route: '/portal/teachers', icon: 'graduation-cap' }
      ]
    },
    {
      labelKey: 'dashboard.menuAssociation',
      icon: 'layers',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemEvents', route: '/portal/events', icon: 'calendar' },
        { labelKey: 'dashboard.itemNotices', route: '/portal/notices', icon: 'megaphone' },
        { labelKey: 'dashboard.itemGallery', route: '/portal/gallery', icon: 'image' },
        { labelKey: 'dashboard.itemCommittee', route: '/portal/committee', icon: 'users' },
        { labelKey: 'dashboard.itemAccounts', route: '/portal/accounts', icon: 'dollar' },
        { labelKey: 'dashboard.itemAbout', route: '/portal/about', icon: 'book' },
        { labelKey: 'dashboard.itemContact', route: '/portal/contact', icon: 'megaphone' }
      ]
    },
    {
      labelKey: 'dashboard.menuCommunity',
      icon: 'briefcase',
      expanded: false,
      children: [
        { labelKey: 'dashboard.itemJobBoard', route: '/portal/jobs', icon: 'briefcase' },
        { labelKey: 'dashboard.itemBloodDonors', route: '/portal/blood-donors', icon: 'droplet' },
        { labelKey: 'dashboard.itemConstitutionLink', route: '/portal/constitution', icon: 'book' }
      ]
    }
  ];

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
    // Copy per instance: `expanded` is UI state and must not leak between shells.
    const menu = this.shell === 'member' ? DashboardComponent.MEMBER_MENU : DashboardComponent.ADMIN_MENU;
    const role: string = auth.getCurrentUser()?.role ?? '';
    this.menuItems = menu
      .map(g => ({ ...g, children: g.children.filter(c => !c.roles || c.roles.includes(role)) }))
      .filter(g => g.children.length > 0);

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
      case 'Representative': return 'dashboard.roleRepresentative';
      default: return 'dashboard.roleMember';
    }
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
