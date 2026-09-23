import { Routes } from '@angular/router';
import { shellRedirectGuard } from './Guards/shell-redirect.guard';
import { AuthGuard } from './Guards/auth.guard';
import { RoleGuard } from './Guards/role.guard';
import { HomeComponent } from './Components/pages/home/home.component';

// Only the homepage ships in the initial bundle; every other page (and the whole
// back office / member portal shell) is its own lazy chunk, so a first visit on a
// phone doesn't download admin screens or chart.js.
//
// `title` is an i18n key under `pageTitles` — AppTitleStrategy translates it and
// appends " — UPSAA" (see Utils/app-title.strategy.ts).
//
// Every public route carries shellRedirectGuard: signed-in members are kept inside
// /portal (never the public site), and staff open the community pages in /dashboard.

const MEMBER_ROLES = ['Representative', 'Member'];
const STAFF_ROLES = ['SuperAdmin', 'Admin'];
const ALL_ROLES = [...STAFF_ROLES, ...MEMBER_ROLES];

// ---- lazy page loaders (shared by the public, portal and back-office routes) ----
const about = () => import('./Components/pages/about/about.component').then(m => m.AboutComponent);
const contact = () => import('./Components/pages/contact/contact.component').then(m => m.ContactComponent);
const events = () => import('./Components/pages/events/events.component').then(m => m.EventsComponent);
const notices = () => import('./Components/pages/notices/notices.component').then(m => m.NoticesComponent);
const directory = () => import('./Components/pages/directory/directory.component').then(m => m.DirectoryComponent);
const batches = () => import('./Components/pages/batches/batches.component').then(m => m.BatchesComponent);
const achievements = () => import('./Components/pages/achievements/achievements.component').then(m => m.AchievementsComponent);
const teachers = () => import('./Components/pages/teachers/teachers.component').then(m => m.TeachersComponent);
const committee = () => import('./Components/pages/committee/committee.component').then(m => m.CommitteeComponent);
const gallery = () => import('./Components/pages/gallery/gallery.component').then(m => m.GalleryComponent);
const jobs = () => import('./Components/pages/jobs/jobs.component').then(m => m.JobsComponent);
const bloodDonors = () => import('./Components/pages/blood-donors/blood-donors.component').then(m => m.BloodDonorsComponent);
const constitution = () => import('./Components/pages/constitution/constitution.component').then(m => m.ConstitutionComponent);
const profile = () => import('./Components/profile/profile.component').then(m => m.ProfileComponent);
const shell = () => import('./Components/dashboard/dashboard.component').then(m => m.DashboardComponent);

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [shellRedirectGuard] },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', loadComponent: about, title: 'pageTitles.about', canActivate: [shellRedirectGuard] },
  { path: 'events', loadComponent: events, title: 'pageTitles.events', canActivate: [shellRedirectGuard] },
  // Public — visitors see public notices; signed-in alumni also get alumni-only ones.
  { path: 'notices', loadComponent: notices, title: 'pageTitles.notices', canActivate: [shellRedirectGuard] },
  {
    path: 'register', title: 'pageTitles.register', canActivate: [shellRedirectGuard],
    loadComponent: () => import('./Components/pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'profile', loadComponent: profile, title: 'pageTitles.profile',
    canActivate: [shellRedirectGuard, AuthGuard, RoleGuard],
    data: { roles: MEMBER_ROLES }
  },

  // Alumni portal — the post-login landing for members, in the same sidebar
  // shell as the back office (DashboardComponent with the member menu).
  {
    path: 'portal', loadComponent: shell,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: MEMBER_ROLES, shell: 'member' },
    children: [
      {
        path: 'home', title: 'pageTitles.portalHome',
        loadComponent: () => import('./Components/pages/member-dashboard/member-dashboard.component').then(m => m.MemberDashboardComponent)
      },
      { path: 'profile', loadComponent: profile, title: 'pageTitles.profile' },
      // Copies of the public pages, so members have everything without leaving the portal.
      { path: 'members', loadComponent: directory, title: 'pageTitles.members' },
      { path: 'batches', loadComponent: batches, title: 'pageTitles.batches' },
      { path: 'events', loadComponent: events, title: 'pageTitles.events' },
      { path: 'notices', loadComponent: notices, title: 'pageTitles.notices' },
      { path: 'gallery', loadComponent: gallery, title: 'pageTitles.gallery' },
      { path: 'achievements', loadComponent: achievements, title: 'pageTitles.achievements' },
      { path: 'teachers', loadComponent: teachers, title: 'pageTitles.teachers' },
      { path: 'committee', loadComponent: committee, title: 'pageTitles.committee' },
      { path: 'about', loadComponent: about, title: 'pageTitles.about' },
      { path: 'contact', loadComponent: contact, title: 'pageTitles.contact' },
      { path: 'jobs', loadComponent: jobs, title: 'pageTitles.jobs' },
      { path: 'blood-donors', loadComponent: bloodDonors, title: 'pageTitles.bloodDonors' },
      { path: 'constitution', loadComponent: constitution, title: 'pageTitles.constitution' },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  // Old landing URL, kept so existing links and bookmarks still reach the welcome page.
  { path: 'member-dashboard', redirectTo: 'portal/home', pathMatch: 'full' },
  {
    path: 'nomination', title: 'pageTitles.nomination',
    loadComponent: () => import('./Components/nomination-application/nomination-application.component').then(m => m.NominationApplicationComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: MEMBER_ROLES }
  },
  {
    path: 'election', title: 'pageTitles.election',
    loadComponent: () => import('./Components/voting-screen/voting-screen.component').then(m => m.VotingScreenComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: MEMBER_ROLES }
  },
  {
    path: 'votecard', title: 'pageTitles.votecard',
    loadComponent: () => import('./Components/vote-card/vote-card.component').then(m => m.VoteCardComponent)
  },

  // Back office — SuperAdmin / Admin.
  {
    path: 'dashboard', loadComponent: shell,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: STAFF_ROLES, shell: 'admin' },
    children: [
      {
        path: 'home', title: 'pageTitles.adminHome',
        loadComponent: () => import('./Components/admin-welcome/admin-welcome.component').then(m => m.AdminWelcomeComponent)
      },
      {
        path: 'candidates', title: 'pageTitles.candidates',
        loadComponent: () => import('./Components/candidates-v2/candidates-v2.component').then(m => m.CandidatesV2Component)
      },
      {
        path: 'elections', title: 'pageTitles.elections',
        loadComponent: () => import('./Components/elections/elections.component').then(m => m.ElectionsComponent)
      },
      {
        path: 'positions', title: 'pageTitles.positions',
        loadComponent: () => import('./Components/positions/positions.component').then(m => m.PositionsComponent)
      },
      {
        path: 'vote-casts', title: 'pageTitles.voteHistory',
        loadComponent: () => import('./Components/vote-casts/vote-casts.component').then(m => m.VoteCastsComponent)
      },
      {
        path: 'members', title: 'pageTitles.memberManagement',
        loadComponent: () => import('./Components/member-landing/member-landing.component').then(m => m.MemberLandingComponent)
      },
      {
        path: 'user-roles', title: 'pageTitles.userRoles',
        loadComponent: () => import('./Components/user-roles/user-roles.component').then(m => m.UserRolesComponent),
        canActivate: [RoleGuard], data: { roles: ['SuperAdmin'] } // SuperAdmin only, also enforced by the API
      },
      {
        path: 'gallery', title: 'pageTitles.galleryAdmin',
        loadComponent: () => import('./Components/gallery-admin/gallery-admin.component').then(m => m.GalleryAdminComponent)
      },
      {
        path: 'notices', title: 'pageTitles.noticeAdmin',
        loadComponent: () => import('./Components/notice-admin/notice-admin.component').then(m => m.NoticeAdminComponent)
      },
      {
        path: 'birthday-automation', title: 'pageTitles.birthdayAutomation',
        loadComponent: () => import('./Components/birthday-automation/birthday-automation.component').then(m => m.BirthdayAutomationComponent)
      },
      {
        path: 'achievements', title: 'pageTitles.achievementAdmin',
        loadComponent: () => import('./Components/achievement-admin/achievement-admin.component').then(m => m.AchievementAdminComponent)
      },
      {
        path: 'teachers', title: 'pageTitles.teacherAdmin',
        loadComponent: () => import('./Components/teacher-admin/teacher-admin.component').then(m => m.TeacherAdminComponent)
      },
      {
        path: 'events', title: 'pageTitles.eventAdmin',
        loadComponent: () => import('./Components/event-admin/event-admin.component').then(m => m.EventAdminComponent)
      },
      {
        path: 'finance', title: 'pageTitles.finance',
        loadComponent: () => import('./Components/finance-ledger/finance-ledger.component').then(m => m.FinanceLedgerComponent)
      },
      { path: 'jobs', loadComponent: jobs, title: 'pageTitles.jobs' },
      { path: 'blood-donors', loadComponent: bloodDonors, title: 'pageTitles.bloodDonors' },
      {
        // Staff manage the document here; members read it at /portal/constitution.
        path: 'constitution', title: 'pageTitles.constitutionAdmin',
        loadComponent: () => import('./Components/constitution-admin/constitution-admin.component').then(m => m.ConstitutionAdminComponent)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  {
    path: 'login', title: 'pageTitles.login', canActivate: [shellRedirectGuard],
    loadComponent: () => import('./Components/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password', title: 'pageTitles.forgotPassword', canActivate: [shellRedirectGuard],
    loadComponent: () => import('./Components/forget-password/forget-password.component').then(m => m.ForgetPasswordComponent)
  },
  {
    path: 'reset-password', title: 'pageTitles.resetPassword', canActivate: [shellRedirectGuard],
    loadComponent: () => import('./Components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  // Public — no login required. Calls the dedicated PublicDirectory API, which only ever
  // returns lean, payment-free fields. Back-office member management is /dashboard/members.
  { path: 'members', loadComponent: directory, title: 'pageTitles.members', canActivate: [shellRedirectGuard] },
  // Public — batch year + active alumni count, linking into /members?batch=YYYY.
  { path: 'batches', loadComponent: batches, title: 'pageTitles.batches', canActivate: [shellRedirectGuard] },
  { path: 'achievements', loadComponent: achievements, title: 'pageTitles.achievements', canActivate: [shellRedirectGuard] },
  { path: 'teachers', loadComponent: teachers, title: 'pageTitles.teachers', canActivate: [shellRedirectGuard] },
  { path: 'committee', loadComponent: committee, title: 'pageTitles.committee', canActivate: [shellRedirectGuard] },
  {
    path: 'constitution', loadComponent: constitution, title: 'pageTitles.constitution',
    canActivate: [shellRedirectGuard, AuthGuard, RoleGuard],
    data: { roles: ALL_ROLES } // members-only
  },
  {
    path: 'blood-donors', loadComponent: bloodDonors, title: 'pageTitles.bloodDonors',
    canActivate: [shellRedirectGuard, AuthGuard, RoleGuard],
    data: { roles: ALL_ROLES } // members-only
  },
  // Public to browse; posting/editing/deleting requires login (component and backend gate that).
  { path: 'jobs', loadComponent: jobs, title: 'pageTitles.jobs', canActivate: [shellRedirectGuard] },
  { path: 'gallery', loadComponent: gallery, title: 'pageTitles.gallery', canActivate: [shellRedirectGuard] },
  {
    path: 'congratulations', title: 'pageTitles.congratulations', canActivate: [shellRedirectGuard],
    loadComponent: () => import('./Components/congratulations/congratulations.component').then(m => m.CongratulationsComponent)
  },
  { path: 'contact', loadComponent: contact, title: 'pageTitles.contact', canActivate: [shellRedirectGuard] },
  {
    path: 'unauthorized', title: 'pageTitles.unauthorized',
    loadComponent: () => import('./Components/pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  { path: '**', redirectTo: '' }
];
