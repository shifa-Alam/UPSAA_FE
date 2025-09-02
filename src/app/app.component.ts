import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./Components/shared/navbar/navbar.component";
import { FooterComponent } from "./Components/shared/footer/footer.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBar, MatProgressBarModule } from "@angular/material/progress-bar";
import { LoadingService } from './Services/loading-service.service';
import { CommonModule } from '@angular/common';
import { AuthService } from './Services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MemberService } from './Services/member.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatProgressBarModule,
    MatMenuModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  profileImageUrl: string | null = null;
  userInitial: string = '';
  isLoading = false;
  title = 'upsaa';
  @ViewChild('sidenav') sidenav!: MatSidenav;
  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.memberService.getProfile().subscribe({
        next: res => {
          this.profileImageUrl = res.photo || null;
          this.userInitial = res.fullName ? res.fullName[0].toUpperCase() : '?';
        },
        error: () => {
          this.profileImageUrl = null;
          this.userInitial = '?';
        }
      });
    }
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }
  constructor(
    public loadingService: LoadingService,
    public authService: AuthService, // for login/logout
    private memberService: MemberService,
    private router: Router) {

  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
