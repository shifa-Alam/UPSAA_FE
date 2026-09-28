import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { CampaignDetail, CampaignService } from '../../../Services/campaign.service';
import { AuthService } from '../../../Services/auth.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { CampaignProgressComponent } from './campaign-progress.component';

/** One campaign: why, how far along, how to give, and who has (those who agreed to be named). */
@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, PageHeaderComponent, EmptyStateComponent, SkeletonComponent,
    TranslatePipe, CampaignProgressComponent],
  templateUrl: './campaign-detail.component.html',
  styleUrl: './campaign-detail.component.scss'
})
export class CampaignDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(CampaignService);
  readonly auth = inject(AuthService);
  private lang = inject(LanguageService);
  private destroyRef = inject(DestroyRef);

  readonly inPortal = this.router.url.startsWith('/portal');
  readonly listLink = this.inPortal ? '/portal/campaigns' : '/campaigns';

  detail: CampaignDetail | null = null;
  loading = true;
  notFound = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(p => Number(p.get('id'))),
      tap(() => { this.loading = true; this.notFound = false; }),
      switchMap(id => Number.isInteger(id) && id > 0 ? this.api.get(id).pipe(catchError(() => of(null))) : of(null)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(d => {
      this.detail = d;
      this.loading = false;
      this.notFound = !d;
    });
  }

  /** Members give from their Payments page, with this campaign picked; staff and visitors can't. */
  get canDonate(): boolean {
    return this.auth.isLoggedIn() && this.auth.hasMemberRecord();
  }

  dateRange(): string {
    const c = this.detail!.campaign;
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    const f = (d: string) => new Date(d.slice(0, 10) + 'T12:00:00+06:00').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    return c.endDate ? `${f(c.startDate)} – ${f(c.endDate)}` : `${f(c.startDate)} ${this.lang.translate('campaigns.fromOnwards')}`;
  }

  num(n: number, plain = false): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { useGrouping: !plain }).format(n);
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
