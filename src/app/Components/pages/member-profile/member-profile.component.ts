import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { MemberService, PublicMemberProfile } from '../../../Services/member.service';
import { AuthService } from '../../../Services/auth.service';
import { LanguageService } from '../../../Services/language.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe } from '../../../Pipes/sized-image.pipe';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { DEGREES } from '../../profile/profile.component';
import { SharedElementService } from '../../../Services/shared-element.service';

/**
 * An alumnus's profile as other people see it — the same "membership card" design as
 * My Profile (it borrows that page's styles), read-only. Opened from a directory card
 * at /members/:id (visitors) or /portal/members/:id (signed-in alumni). Phone, email and
 * birthday follow the API's privacy rule; fees are never shown here.
 */
@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe, SizedImagePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './member-profile.component.html',
  styleUrl: './member-profile.component.scss'
})
export class MemberProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private memberService = inject(MemberService);
  private lang = inject(LanguageService);
  private location = inject(Location);
  private router = inject(Router);
  private title = inject(Title);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);
  private shared = inject(SharedElementService);

  member: PublicMemberProfile | null = null;
  loading = true;
  /** Header drawn from the directory card; contact/education still on their way. */
  detailsLoading = false;
  notFound = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(p => Number(p.get('id'))),
      distinctUntilChanged(),
      tap(id => {
        this.notFound = false;
        const preview = this.shared.preview?.id === id ? this.shared.preview : null;
        if (preview) {
          // Show the card's data right away (and let its photo morph into place).
          this.member = {
            id: preview.id, fullName: preview.fullName, batch: preview.batch, photo: preview.photo ?? null,
            currentDesignation: preview.currentDesignation ?? null, employer: preview.employer ?? null,
            currentCity: preview.currentCity ?? null, bloodGroup: preview.bloodGroup ?? null, memberCode: preview.memberCode ?? null,
            phone: null, email: null, dob: null, contactHiddenReason: null, education: [],
          };
          this.loading = false;
          this.detailsLoading = true;
        } else {
          this.loading = true;
        }
      }),
      switchMap(id => Number.isInteger(id) && id > 0
        ? this.memberService.getPublicProfile(id).pipe(catchError(() => of(null)))
        : of(null)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(member => {
      this.loading = false;
      this.detailsLoading = false;
      this.member = member;
      this.notFound = !member;
      if (member) {
        this.title.setTitle(`${member.fullName} — UPSAA`);
        this.shared.memberId.set(member.id); // the card to fly back to
      }
    });
  }

  /** The directory this profile belongs to (public or portal copy). */
  get directoryLink(): string {
    return this.auth.isLoggedIn() && !this.auth.isStaff() ? '/portal/members' : '/members';
  }

  back(): void {
    // Opened from the directory: go back to it (keeps its filters/page). Opened from a
    // shared link: there's nothing to go back to, so open the directory instead.
    const fromApp = typeof window !== 'undefined' && (window.history.state?.navigationId ?? 1) > 1;
    if (fromApp) this.location.back();
    else this.router.navigateByUrl(this.directoryLink);
  }

  get sortedEducation() {
    return [...(this.member?.education ?? [])].sort((a, b) => b.degreeId - a.degreeId);
  }

  degreeLabel(degreeId: number, fallback: string | null): string {
    const d = DEGREES.find(x => x.id === degreeId);
    return d ? this.lang.translate(`profile.degrees.${d.key}`) : (fallback ?? '');
  }

  initials(name: string): string {
    return name?.trim().charAt(0).toUpperCase() || '?';
  }

  private get locale(): string {
    return this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  formatPlain(value: number): string {
    return new Intl.NumberFormat(this.locale, { useGrouping: false }).format(value);
  }

  /** Birthday without the year — the day people celebrate, not their age. */
  birthday(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'long' }).format(d);
  }
}
