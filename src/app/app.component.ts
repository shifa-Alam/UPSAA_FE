import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
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
import { SizedImagePipe } from './Pipes/sized-image.pipe';
import { BottomNavComponent } from './Components/shared/bottom-nav/bottom-nav.component';
import { InstallBannerComponent } from './Components/shared/install-banner/install-banner.component';
import { PwaService } from './Services/pwa.service';
import { PushService } from './Services/push.service';
import { PushToggleComponent } from './Components/shared/push-toggle/push-toggle.component';
import { installImageFadeIn } from './Utils/image-fade';
import { ScrollPositionService } from './Services/scroll-position.service';
import { SheetGestureService } from './Services/sheet-gesture.service';
import { PullToRefreshService } from './Services/pull-to-refresh.service';
import { SmartHeaderDirective } from './Components/shared/smart-header/smart-header.directive';
import { MatIconRegistry } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ChangePasswordComponent } from './Components/change-password/change-password.component';
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
    SizedImagePipe,
    BottomNavComponent,
    InstallBannerComponent,
    PushToggleComponent,
    SmartHeaderDirective,
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
    this.pwa.init();
    this.scrollPositions.init(); // new page → top; Back → where you were
    this.sheets.init();          // phone dialogs: pull down to close
    this.pullToRefresh.init();   // installed app: pull down at the top to reload
    // Signed in (now or on a later login): tie this phone's notifications to the member.
    this.authService.user$.pipe(filter(u => !!u)).subscribe(() => this.push.linkToCurrentUser());
    this.isDashboardRoute = this.isShellUrl(this.router.url);
    this.updateSectionActive(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.isDashboardRoute = this.isShellUrl(e.urlAfterRedirects);
        this.updateSectionActive(e.urlAfterRedirects);
        this.requirePasswordChange();
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

  private passwordDialog?: MatDialogRef<ChangePasswordComponent>;

  /** Still on a temporary (SMS'd or admin-set) password: the first thing is choosing a new one.
   *  The dialog can't be dismissed; saving logs out, and the new password signs back in. */
  private requirePasswordChange(): void {
    if (this.passwordDialog || !this.authService.mustChangePassword()) return;
    this.passwordDialog = this.dialog.open(ChangePasswordComponent, {
      width: '440px',
      disableClose: true,
      data: { forced: true },
    });
    this.passwordDialog.afterClosed().subscribe(() => (this.passwordDialog = undefined));
  }

  private searchDialog?: MatDialogRef<unknown>;

  /** Site-wide search — header button, Ctrl/⌘+K, or "/" outside a text field. */
  async openSearch(): Promise<void> {
    if (this.searchDialog || this.passwordDialog) return;
    const { SiteSearchComponent } = await import('./Components/shared/site-search/site-search.component');
    this.searchDialog = this.dialog.open(SiteSearchComponent, {
      width: '620px',
      maxWidth: '94vw',
      position: { top: '10vh' },
      autoFocus: false,
      restoreFocus: true,
    });
    this.searchDialog.afterClosed().subscribe(() => (this.searchDialog = undefined));
  }

  @HostListener('document:keydown', ['$event'])
  onSearchShortcut(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.openSearch();
    } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.openSearch();
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
    public pwa: PwaService,
    private push: PushService,
    private scrollPositions: ScrollPositionService,
    private sheets: SheetGestureService,
    private pullToRefresh: PullToRefreshService,
    iconRegistry: MatIconRegistry,
    private dialog: MatDialog,
    private router: Router, private breakpointObserver: BreakpointObserver, @Inject(PLATFORM_ID) private platformId: any) {
    // Softer, rounded icons everywhere: every <mat-icon> uses the Symbols Rounded font.
    iconRegistry.setDefaultFontSetClass('material-symbols-rounded');
    // Before any page renders, so the first photos get the blur-up too.
    if (isPlatformBrowser(platformId)) installImageFadeIn(document);
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
