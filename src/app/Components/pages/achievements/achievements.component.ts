import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AchievementService, Achievement } from '../../../Services/achievement.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './achievements.component.html',
  styleUrl: './achievements.component.scss'
})
export class AchievementsComponent implements OnInit {
  achievements: Achievement[] = [];
  loading = true;
  loadError = false;

  constructor(private achievementService: AchievementService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.achievementService.getAll().pipe(
      catchError(() => of(null))
    ).subscribe(achievements => {
      this.loading = false;

      if (!achievements) {
        this.loadError = true;
        return;
      }

      this.achievements = achievements;
    });
  }

  /** The first achievement (as the API orders them) gets the spotlight card. */
  get featured(): Achievement | null {
    return this.achievements[0] ?? null;
  }

  get rest(): Achievement[] {
    return this.achievements.slice(1);
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  formatBatch(batch: number): string {
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: false }).format(batch);
  }
}
