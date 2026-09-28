import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, forkJoin, of } from 'rxjs';
import { Achievement, AchievementService } from '../../Services/achievement.service';
import { Business, CommunityService, Memory } from '../../Services/community.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { SizedImagePipe } from '../../Pipes/sized-image.pipe';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';

type Tab = 'achievements' | 'memories' | 'businesses';
type Kind = 'Achievement' | 'Memory' | 'Business';

/**
 * Back office: everything members submitted that waits for a decision — achievements,
 * memory-wall posts and business listings — in one place. Approve publishes it;
 * reject asks for a short reason the member will see.
 */
@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe, SizedImagePipe, AdminHeaderComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.scss'
})
export class ApprovalsComponent implements OnInit {
  private achievementsApi = inject(AchievementService);
  private community = inject(CommunityService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);

  tab: Tab = 'achievements';
  loading = true;
  achievements: Achievement[] = [];
  memories: Memory[] = [];
  businesses: Business[] = [];
  busy = new Set<string>();

  ngOnInit(): void {
    forkJoin({
      achievements: this.achievementsApi.pending().pipe(catchError(() => of([] as Achievement[]))),
      memories: this.community.pendingMemories().pipe(catchError(() => of([] as Memory[]))),
      businesses: this.community.pendingBusinesses().pipe(catchError(() => of([] as Business[])))
    }).subscribe(r => {
      this.loading = false;
      this.achievements = r.achievements;
      this.memories = r.memories;
      this.businesses = r.businesses;
      // Open the first tab that has something waiting.
      this.tab = r.achievements.length ? 'achievements' : r.memories.length ? 'memories' : r.businesses.length ? 'businesses' : 'achievements';
    });
  }

  count(tab: Tab): number {
    return this[tab].length;
  }

  review(kind: Kind, id: number, approve: boolean): void {
    let note: string | undefined;
    if (!approve) {
      const answer = window.prompt(this.lang.translate('approvals.rejectPrompt'), '');
      if (answer === null) return; // cancelled
      note = answer.trim() || undefined;
    }
    const key = `${kind}:${id}`;
    this.busy.add(key);
    this.community.review(kind, id, approve, note).subscribe({
      next: () => {
        this.busy.delete(key);
        if (kind === 'Achievement') this.achievements = this.achievements.filter(x => x.id !== id);
        if (kind === 'Memory') this.memories = this.memories.filter(x => x.id !== id);
        if (kind === 'Business') this.businesses = this.businesses.filter(x => x.id !== id);
        this.snackbar.showSuccess(this.lang.translate(approve ? 'approvals.approved' : 'approvals.rejected'));
      },
      error: () => {
        this.busy.delete(key);
        this.snackbar.showError(this.lang.translate('approvals.failed'));
      }
    });
  }

  isBusy(kind: Kind, id: number): boolean {
    return this.busy.has(`${kind}:${id}`);
  }

  date(iso: string): string {
    return new Intl.DateTimeFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
