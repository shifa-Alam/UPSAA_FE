import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
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
import { ThemeService } from './Services/theme.service';
import { LanguageService } from './Services/language.service';
import { TranslatePipe } from './Pipes/translate.pipe';

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
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
    FooterComponent,
    TranslatePipe,
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
  isMobile$: Observable<boolean>;
  /** The back office (/dashboard) and alumni portal (/portal) have their own full-height sidebar layout — the public site's top toolbar
   *  and footer don't belong around it. */
  isDashboardRoute = false;

  /** Routes grouped under the desktop nav's "Alumni" and "Community" dropdowns —
   *  used to highlight the dropdown trigger itself when a child route is active,
   *  the way routerLinkActive would for a plain link. */
  private readonly alumniRoutes = ['/members', '/batches', '/achievements', '/teachers'];
  private readonly communityRoutes = ['/blood-donors', '/constitution'];
  isAlumniSectionActive = false;
  isCommunitySectionActive = false;

  /** Community pages live inside the sidebar shell once signed in (see shellRedirectGuard);
   *  linking there directly keeps routerLinkActive highlighting accurate. */
  shellLink(page: string): string {
    if (!this.authService.isLoggedIn()) return `/${page}`;
    return `${this.authService.isStaff() ? '/dashboard' : '/portal'}/${page}`;
  }

  private isShellUrl(url: string): boolean {
    return url.startsWith('/dashboard') || url.startsWith('/portal');
  }

  ngOnInit() {
    this.isDashboardRoute = this.isShellUrl(this.router.url);
    this.updateSectionActive(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.isDashboardRoute = this.isShellUrl(e.urlAfterRedirects);
        this.updateSectionActive(e.urlAfterRedirects);
      });

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

  private updateSectionActive(url: string): void {
    const path = url.split('?')[0];
    this.isAlumniSectionActive = this.alumniRoutes.some(r => path === r || path.startsWith(r + '/'));
    this.isCommunitySectionActive = this.communityRoutes.some(r => path === r || path.startsWith(r + '/'));
  }
  constructor(
    public loadingService: LoadingService,
    public authService: AuthService, // for login/logout
    public themeService: ThemeService,
    public languageService: LanguageService,
    private memberService: MemberService,
    private router: Router, private breakpointObserver: BreakpointObserver, @Inject(PLATFORM_ID) private platformId: any) {
    this.isMobile$ = this.breakpointObserver
      // Must match the CSS breakpoint that hides the dashboard sidebar, or tablets lose all navigation.
      .observe(['(max-width: 768px)'])
      .pipe(map(result => result.matches));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
