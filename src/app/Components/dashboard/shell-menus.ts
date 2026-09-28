import { NavIconName } from '../shared/nav-icon/nav-icon.component';

/**
 * The back-office and member-portal menus — the ONE definition used by both the desktop
 * sidebar (DashboardComponent) and the phone drawer (AppComponent). Add a page here and
 * it appears in both; the two can no longer drift apart.
 */

export interface MenuChild {
  labelKey: string;
  route: string;
  icon: NavIconName;
  /** Only these roles see the item; omitted = everyone in this shell. */
  roles?: string[];
}

export interface MenuGroup {
  labelKey: string;
  icon: NavIconName;
  expanded: boolean;
  children: MenuChild[];
}

export type ShellKind = 'admin' | 'member';

const ADMIN_MENU: MenuGroup[] = [
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
      { labelKey: 'dashboard.itemTestimonials', route: '/dashboard/testimonials', icon: 'quote' },
      { labelKey: 'dashboard.itemTeachers', route: '/dashboard/teachers', icon: 'graduation-cap' },
      { labelKey: 'dashboard.itemEvents', route: '/dashboard/events', icon: 'calendar' }
    ]
  },
  {
    labelKey: 'dashboard.menuFinance',
    icon: 'dollar',
    expanded: false,
    children: [
      { labelKey: 'dashboard.itemFinance', route: '/dashboard/finance', icon: 'dollar' },
      { labelKey: 'dashboard.itemPaymentAdmin', route: '/dashboard/payments', icon: 'card' },
      { labelKey: 'dashboard.itemCampaignAdmin', route: '/dashboard/campaigns', icon: 'heart' },
      { labelKey: 'dashboard.itemReports', route: '/dashboard/reports', icon: 'bar-chart' }
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
  },
  {
    labelKey: 'dashboard.menuSystem',
    icon: 'activity',
    expanded: false,
    children: [
      { labelKey: 'dashboard.itemSms', route: '/dashboard/sms', icon: 'megaphone' },
      { labelKey: 'dashboard.itemErrorLog', route: '/dashboard/error-log', icon: 'activity', roles: ['SuperAdmin'] }
    ]
  }
];

// Member portal. Everything renders inside the shell — members never see the
// public site (see shellRedirectGuard).
const MEMBER_MENU: MenuGroup[] = [
  {
    labelKey: 'dashboard.menuMyAccount',
    icon: 'users',
    expanded: false,
    children: [
      { labelKey: 'dashboard.itemMyProfile', route: '/portal/profile', icon: 'user-check' },
      { labelKey: 'dashboard.itemPayments', route: '/portal/payments', icon: 'card' }
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
      { labelKey: 'dashboard.itemCampaigns', route: '/portal/campaigns', icon: 'heart' },
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

/**
 * A fresh copy of one shell's menu, with items the role may not see removed (and groups
 * left empty by that dropped). A copy, because `expanded` is per-instance UI state.
 */
export function menuFor(shell: ShellKind, role: string): MenuGroup[] {
  const menu = shell === 'member' ? MEMBER_MENU : ADMIN_MENU;
  return menu
    .map(g => ({ ...g, children: g.children.filter(c => !c.roles || c.roles.includes(role)) }))
    .filter(g => g.children.length > 0);
}
