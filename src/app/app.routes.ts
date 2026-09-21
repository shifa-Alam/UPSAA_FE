
import { Routes } from '@angular/router';
import { AboutComponent } from './Components/pages/about/about.component';
import { ContactComponent } from './Components/pages/contact/contact.component';
import { DirectoryComponent } from './Components/pages/directory/directory.component';
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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'events', component: EventsComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'profile', component: ProfileComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Representative', 'Member'] } // only these roles
  },
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
    data: { roles: ['SuperAdmin'] },// only these roles
    children: [

      // { path: 'candidates', component: CandidatesComponent },
      { path: 'candidates', component: CandidatesV2Component },
      { path: 'elections', component: ElectionsComponent },
      { path: 'positions', component: PositionsComponent },

      { path: 'vote-casts', component: VoteCastsComponent },
      { path: '', redirectTo: 'elections', pathMatch: 'full' }
    ]
  }
  ,
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgetPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'members',
    component: DirectoryComponent
    // Public — no login required. Calls the dedicated PublicDirectory API, which
    // only ever returns lean, payment-free fields — a different component and a
    // different endpoint from the authenticated member-management view below.
  },
  {
    path: 'members/manage',
    component: MemberLandingComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SuperAdmin', 'Admin', 'Representative', 'Member'] } // only these roles
  },
  {
    path: 'committee',
    component: CommitteeComponent
    // Public page — no login required, anyone can see the elected committee.
  },
  { path: 'congratulations', component: CongratulationsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  { path: '**', redirectTo: '' }
];

