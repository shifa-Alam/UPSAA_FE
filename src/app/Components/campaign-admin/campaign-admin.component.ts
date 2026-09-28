import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Campaign, CampaignSave, CampaignService } from '../../Services/campaign.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { ConfirmService } from '../../Services/confirm.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { CampaignProgressComponent } from '../pages/campaigns/campaign-progress.component';

/** Staff: create and run fundraising campaigns (goal, dates, cash raised offline, publish). */
@Component({
  selector: 'app-campaign-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, AdminHeaderComponent, SectionCardComponent,
    EmptyStateComponent, SkeletonComponent, TranslatePipe, CampaignProgressComponent],
  templateUrl: './campaign-admin.component.html',
  styleUrl: './campaign-admin.component.scss'
})
export class CampaignAdminComponent implements OnInit {
  private api = inject(CampaignService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);
  private confirm = inject(ConfirmService);

  campaigns: Campaign[] = [];
  loading = true;
  loadError = false;
  saving = false;
  deletingId: number | null = null;

  /** null = creating a new one. */
  editingId: number | null = null;
  form: CampaignSave = this.blank();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.all().subscribe({
      next: list => { this.campaigns = list; this.loading = false; this.loadError = false; },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  edit(c: Campaign): void {
    this.editingId = c.id;
    this.form = {
      title: c.title,
      description: c.description,
      goalAmount: c.goalAmount,
      startDate: c.startDate.slice(0, 10),
      endDate: c.endDate ? c.endDate.slice(0, 10) : null,
      isPublished: c.isPublished,
      offlineAmount: c.offlineAmount,
    };
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form = this.blank();
  }

  save(): void {
    const data: CampaignSave = {
      ...this.form,
      title: (this.form.title ?? '').trim(),
      description: this.form.description?.trim() || null,
      goalAmount: Number(this.form.goalAmount) || 0,
      offlineAmount: Number(this.form.offlineAmount) || 0,
      endDate: this.form.endDate || null,
    };
    this.saving = true;
    const req = this.editingId ? this.api.update(this.editingId, data) : this.api.create(data);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.snackbar.showSuccess(this.lang.translate(this.editingId ? 'campaignAdmin.updated' : 'campaignAdmin.created'));
        this.cancelEdit();
        this.load();
      },
      error: err => {
        this.saving = false;
        this.snackbar.showError(err?.error?.message ?? this.lang.translate('campaignAdmin.failed'));
      }
    });
  }

  remove(c: Campaign): void {
    this.confirm.askDelete(c.title, this.lang.translate('campaignAdmin.deleteQuestion')).subscribe(ok => {
      if (!ok) return;
      this.deletingId = c.id;
      this.api.delete(c.id).subscribe({
        next: () => { this.deletingId = null; this.snackbar.showSuccess(this.lang.translate('campaignAdmin.deleted')); this.load(); },
        error: err => { this.deletingId = null; this.snackbar.showError(err?.error?.message ?? this.lang.translate('campaignAdmin.failed')); }
      });
    });
  }

  status(c: Campaign): 'draft' | 'open' | 'ended' | 'upcoming' {
    if (!c.isPublished) return 'draft';
    if (c.isOpen) return 'open';
    return new Date(c.startDate.slice(0, 10) + 'T00:00:00+06:00').getTime() > Date.now() ? 'upcoming' : 'ended';
  }

  statusPill(c: Campaign): string {
    return { draft: 'pill--neutral', open: 'pill--success', upcoming: 'pill--info', ended: 'pill--heritage' }[this.status(c)];
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  private blank(): CampaignSave {
    const today = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10); // Bangladesh date
    return { title: '', description: '', goalAmount: 0, startDate: today, endDate: null, isPublished: true, offlineAmount: 0 };
  }
}
