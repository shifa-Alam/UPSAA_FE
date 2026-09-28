import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Campaign, CampaignService, campaignDaysLeft, campaignPercent } from '../../../Services/campaign.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { CampaignProgressComponent } from './campaign-progress.component';

/** Fundraising campaigns: running ones first, then finished ones. Public and in the portal. */
@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, PageHeaderComponent, EmptyStateComponent, SkeletonComponent,
    RevealDirective, TranslatePipe, CampaignProgressComponent],
  templateUrl: './campaigns.component.html',
  styleUrl: './campaigns.component.scss'
})
export class CampaignsComponent implements OnInit {
  private api = inject(CampaignService);
  private router = inject(Router);
  private lang = inject(LanguageService);

  readonly base = this.router.url.startsWith('/portal') ? '/portal/campaigns' : '/campaigns';

  open: Campaign[] = [];
  closed: Campaign[] = [];
  loading = true;
  loadError = false;

  ngOnInit(): void {
    this.api.list().subscribe({
      next: list => {
        this.open = list.filter(c => c.isOpen);
        this.closed = list.filter(c => !c.isOpen);
        this.loading = false;
      },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  percent = campaignPercent;
  daysLeft = campaignDaysLeft;

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }
}
