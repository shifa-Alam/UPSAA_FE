
import { Routes } from '@angular/router';
import { AboutComponent } from './Components/pages/about/about.component';
import { ContactComponent } from './Components/pages/contact/contact.component';
import { DirectoryComponent } from './Components/pages/directory/directory.component';
import { EventsComponent } from './Components/pages/events/events.component';
import { HomeComponent } from './Components/pages/home/home.component';
import { RegisterComponent } from './Components/pages/register/register.component';
import { CongratulationsComponent } from './Components/congratulations/congratulations.component';
import { MemberLandingComponent } from './Components/member-landing/member-landing.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'events', component: EventsComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'directory', component: DirectoryComponent },
  { path: 'members', component: MemberLandingComponent },
  { path: 'congratulations', component: CongratulationsComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', redirectTo: '' }
];
