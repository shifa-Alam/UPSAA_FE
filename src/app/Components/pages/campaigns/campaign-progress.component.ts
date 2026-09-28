import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Campaign, campaignDaysLeft, campaignPercent } from '../../../Services/campaign.service';
import { LanguageService } from '../../../Services/language.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

/**
 * Raised-vs-goal meter with its numbers in text beside it (the bar is never the only
 * carrier of the value): "৳৩৫,০০০ of ৳৫০,০০০ · 70%", then donors and days left.
 */
@Component({
  selector: 'app-campaign-progress',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="cp" [class.cp--lg]="size === 'lg'">
      <p class="cp__amounts">
        <span class="cp__raised">{{ money(campaign.raised) }}</span>
        <span class="cp__goal">{{ 'campaigns.of' | translate }} {{ money(campaign.goalAmount) }}</span>
      </p>
      <div class="cp__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent"
        [attr.aria-label]="('campaigns.progressLabel' | translate) + ': ' + num(percent) + '%'">
        <span class="cp__fill" [style.width.%]="percent"></span>
      </div>
      <p class="cp__meta">
        <b>{{ num(percent) }}%</b>
        <span>· {{ num(campaign.donorCount) }} {{ 'campaigns.donors' | translate }}</span>
        <span *ngIf="daysLeft !== null">· {{ daysLeft === 0 ? ('campaigns.lastDay' | translate) : num(daysLeft) + ' ' + ('campaigns.daysLeft' | translate) }}</span>
        <span *ngIf="!campaign.isOpen">· {{ 'campaigns.ended' | translate }}</span>
      </p>
    </div>
  `,
  styles: [`
    .cp__amounts { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; margin: 0 0 8px; }
    .cp__raised { font-family: var(--font-display); font-size: var(--font-size-lg, 20px); font-weight: 700; color: var(--color-ink-900); }
    .cp--lg .cp__raised { font-size: clamp(26px, 4vw, 36px); }
    .cp__goal { font-size: var(--font-size-sm); color: var(--color-ink-600); }
    .cp__track { height: 10px; border-radius: 999px; background: var(--color-ink-100); overflow: hidden; }
    .cp--lg .cp__track { height: 14px; }
    .cp__fill { display: block; height: 100%; min-width: 4px; border-radius: 999px; background: var(--color-chart-1);
      transition: width 700ms var(--ease-out, ease-out); }
    .cp__meta { display: flex; flex-wrap: wrap; gap: 2px 6px; margin: 8px 0 0; font-size: var(--font-size-sm); color: var(--color-ink-600); }
    .cp__meta b { color: var(--color-ink-900); }
    @media (prefers-reduced-motion: reduce) { .cp__fill { transition: none; } }
  `]
})
export class CampaignProgressComponent {
  @Input({ required: true }) campaign!: Campaign;
  @Input() size: 'md' | 'lg' = 'md';

  private lang = inject(LanguageService);

  get percent(): number {
    return campaignPercent(this.campaign);
  }

  get daysLeft(): number | null {
    return campaignDaysLeft(this.campaign);
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  money(n: number): string {
    return '৳' + new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { maximumFractionDigits: 0 }).format(n);
  }
}
