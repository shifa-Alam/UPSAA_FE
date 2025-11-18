
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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'events', component: EventsComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'profile', component: ProfileComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Representative','Member'] } // only these roles
   },
   { 
    path: 'election', component: VotingScreenComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Representative','Member'] } // only these roles
   },
  {
    path: 'directory', component: DirectoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SuperAdmin', 'Admin', 'Representative','Member'] } // only these roles

  },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgetPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'members',
    component: MemberLandingComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SuperAdmin', 'Admin', 'Representative','Member'] } // only these roles
  },
  { path: 'congratulations', component: CongratulationsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  { path: '**', redirectTo: '' }
];

