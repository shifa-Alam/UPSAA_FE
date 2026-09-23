
import { shellRedirectGuard } from './Guards/shell-redirect.guard';
import { UserRolesComponent } from './Components/user-roles/user-roles.component';
import { ConstitutionAdminComponent } from './Components/constitution-admin/constitution-admin.component';
import { AdminWelcomeComponent } from './Components/admin-welcome/admin-welcome.component';
import { Routes } from '@angular/router';
import { AboutComponent } from './Components/pages/about/about.component';
import { ContactComponent } from './Components/pages/contact/contact.component';
import { DirectoryComponent } from './Components/pages/directory/directory.component';
import { BatchesComponent } from './Components/pages/batches/batches.component';
import { AchievementsComponent } from './Components/pages/achievements/achievements.component';
import { AchievementAdminComponent } from './Components/achievement-admin/achievement-admin.component';
import { TeachersComponent } from './Components/pages/teachers/teachers.component';
import { TeacherAdminComponent } from './Components/teacher-admin/teacher-admin.component';
import { EventAdminComponent } from './Components/event-admin/event-admin.component';
import { BloodDonorsComponent } from './Components/pages/blood-donors/blood-donors.component';
import { JobsComponent } from './Components/pages/jobs/jobs.component';
import { MemberDashboardComponent } from './Components/pages/member-dashboard/member-dashboard.component';
import { EventsComponent } from './Components/pages/events/events.component';
import { HomeComponent } from './Components/pages/home/home.component';
import { RegisterComponent } from './Components/pages/register/register.component';
import { CongratulationsComponent } from './Components/congratulations/congratulations.component';
import { MemberLandingComponent } from './Components/member-landing/member-landing.component';
import { AuthGuard } from './Guards/auth.guard';
import { RoleGuard } from './Guards/role.guard';
import { UnauthorizedComponent } from './Components/pages/unauthorized/unauthorized.component';
import { LoginComponent } from './Components/pages/login/login.component';
import { ProfileComponent } from './Components/profile/profile.component';
import { ResetPasswordComponent } from './Components/reset-password/reset-password.component';
import { ForgetPasswordComponent } from './Components/forget-password/forget-password.component';
import { VotingScreenComponent } from './Components/voting-screen/voting-screen.component';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { CandidatesComponent } from './Components/candidates/candidates.component';
import { ElectionsComponent } from './Components/elections/elections.component';
import { PositionsComponent } from './Components/positions/positions.component';
import { VoteCastsComponent } from './Components/vote-casts/vote-casts.component';
import { CandidateAddComponent } from './Components/candidate-add/candidate-add.component';
import { NominationApplicationComponent } from './Components/nomination-application/nomination-application.component';
import { CandidatesV2Component } from './Components/candidates-v2/candidates-v2.component';
import { VoteCardComponent } from './Components/vote-card/vote-card.component';
import { CommitteeComponent } from './Components/pages/committee/committee.component';
import { ConstitutionComponent } from './Components/pages/constitution/constitution.component';
import { GalleryComponent } from './Components/pages/gallery/gallery.component';
import { GalleryAdminComponent } from './Components/gallery-admin/gallery-admin.component';
import { NoticeAdminComponent } from './Components/notice-admin/notice-admin.component';
import { BirthdayAutomationComponent } from './Components/birthday-automation/birthday-automation.component';
import { FinanceLedgerComponent } from './Components/finance-ledger/finance-ledger.component';

// Every public route carries shellRedirectGuard: signed-in members are kept inside
// /portal (never the public site), and staff open the community pages in /dashboard.
export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [shellRedirectGuard] },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', component: AboutComponent, canActivate: [shellRedirectGuard] },
  { path: 'events', component: EventsComponent, canActivate: [shellRedirectGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [shellRedirectGuard] },
  {
    path: 'profile', component: ProfileComponent,
    canActivate: [shellRedirectGuard, AuthGuard, RoleGuard],
    data: { roles: ['Representative', 'Member'] } // only these roles
  },
  // Alumni portal — the post-login landing for members, in the same sidebar
  // shell as the back office (DashboardComponent with the member menu).
  {
    path: 'portal', component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Representative', 'Member'], shell: 'member' },
    children: [
      { path: 'home', component: MemberDashboardComponent },
      { path: 'profile', component: ProfileComponent },
      // Copies of the public pages, so members have everything without leaving the portal.
      { path: 'members', component: DirectoryComponent },
      { path: 'batches', component: BatchesComponent },
      { path: 'events', component: EventsComponent },
      { path: 'gallery', component: GalleryComponent },
      { path: 'achievements', component: AchievementsComponent },
      { path: 'teachers', component: TeachersComponent },
      { path: 'committee', component: CommitteeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'jobs', component: JobsComponent },
      { path: 'blood-donors', component: BloodDonorsComponent },
      { path: 'constitution', component: ConstitutionComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  // Old landing URL, kept so existing links and bookmarks still reach the welcome page.
  { path: 'member-dashboard', redirectTo: 'portal/home', pathMatch: 'full' },
  {
    path: 'nomination', component: NominationApplicationComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Representative', 'Member'] } // only these roles
  },
  {
    path: 'election', component: VotingScreenComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Representative', 'Member'] } // only these roles
  },
  { path: 'votecard', component: VoteCardComponent },


  {
    path: 'dashboard', component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SuperAdmin', 'Admin'], shell: 'admin' },// only these roles
    children: [

      // { path: 'candidates', component: CandidatesComponent },
      { path: 'candidates', component: CandidatesV2Component },
      { path: 'elections', component: ElectionsComponent },
      { path: 'positions', component: PositionsComponent },

      { path: 'vote-casts', component: VoteCastsComponent },
      { path: 'members', component: MemberLandingComponent },
      {
        path: 'user-roles', component: UserRolesComponent,
        canActivate: [RoleGuard], data: { roles: ['SuperAdmin'] } // SuperAdmin only, also enforced by the API
      },
      { path: 'gallery', component: GalleryAdminComponent },
      { path: 'notices', component: NoticeAdminComponent },
      { path: 'birthday-automation', component: BirthdayAutomationComponent },
      { path: 'achievements', component: AchievementAdminComponent },
      { path: 'teachers', component: TeacherAdminComponent },
      { path: 'events', component: EventAdminComponent },
      { path: 'finance', component: FinanceLedgerComponent },
      { path: 'home', component: AdminWelcomeComponent },
      { path: 'jobs', component: JobsComponent },
      { path: 'blood-donors', component: BloodDonorsComponent },
      // Staff manage the document here; members read it at /portal/constitution.
      { path: 'constitution', component: ConstitutionAdminComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
  ,
  { path: 'login', component: LoginComponent, canActivate: [shellRedirectGuard] },
  { path: 'forgot-password', component: ForgetPasswordComponent, canActivate: [shellRedirectGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [shellRedirectGuard] },
  {
    path: 'members',
    component: DirectoryComponent,
    canActivate: [shellRedirectGuard]
    // Public — no login required. Calls the dedicated PublicDirectory API, which
    // only ever returns lean, payment-free fields. Back-office member management
    // now lives at /dashboard/members (SuperAdmin/Admin only) — Representative
    // and Member no longer have a "manage" view, just this public directory.
  },
  {
    path: 'batches',
    component: BatchesComponent,
    canActivate: [shellRedirectGuard]
    // Public — no login required. Batch year + active alumni count, links into
    // /members?batch=YYYY (the public directory above) for the "View Alumni" click.
  },
  {
    path: 'achievements',
    component: AchievementsComponent,
    canActivate: [shellRedirectGuard]
    // Public — no login required. "Our Proud Alumni" showcase.
  },
  {
    path: 'teachers',
    component: TeachersComponent,
    canActivate: [shellRedirectGuard]
    // Public — no login required. Current/Former/Retired teachers & staff.
  },
  {
    path: 'committee',
    component: CommitteeComponent,
    canActivate: [shellRedirectGuard]
    // Public page — no login required, anyone can see the elected committee.
  },
  {
    path: 'constitution',
    component: ConstitutionComponent,
    canActivate: [shellRedirectGuard, AuthGuard, RoleGuard],
    data: { roles: ['SuperAdmin', 'Admin', 'Representative', 'Member'] } // members-only
  },
  {
    path: 'blood-donors',
    component: BloodDonorsComponent,
    canActivate: [shellRedirectGuard, AuthGuard, RoleGuard],
    data: { roles: ['SuperAdmin', 'Admin', 'Representative', 'Member'] } // members-only
  },
  {
    path: 'jobs',
    component: JobsComponent,
    canActivate: [shellRedirectGuard]
    // Public — no login required to browse; signed-in users are forwarded to the
    // copy inside their sidebar shell. Posting/editing/deleting still requires
    // login (any role); the component and backend both gate that.
  },
  {
    path: 'gallery',
    component: GalleryComponent,
    canActivate: [shellRedirectGuard]
    // Public — no login required, event photos for everyone to browse.
  },
  { path: 'congratulations', component: CongratulationsComponent, canActivate: [shellRedirectGuard] },
  { path: 'contact', component: ContactComponent, canActivate: [shellRedirectGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },

  { path: '**', redirectTo: '' }
];

