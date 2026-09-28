import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { Achievement, AchievementService } from '../../../../Services/achievement.service';
import { AuthService } from '../../../../Services/auth.service';
import { LanguageService } from '../../../../Services/language.service';
import { SnackbarService } from '../../../../Services/snackbar.service';
import { TranslatePipe } from '../../../../Pipes/translate.pipe';

/**
 * "Tell us about your achievement" — members submit their own promotion, degree or award;
 * it appears on the Achievements page once staff approve it. Shows the member's own
 * submissions and their review status. Renders nothing for visitors and staff accounts.
 */
@Component({
  selector: 'app-achievement-submit',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './achievement-submit.component.html',
  styleUrl: './achievement-submit.component.scss'
})
export class AchievementSubmitComponent implements OnInit, OnDestroy {
  private service = inject(AchievementService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);
  auth = inject(AuthService);

  open = false;
  title = '';
  description = '';
  profession = '';
  organization = '';
  file: File | null = null;
  preview: string | null = null;
  saving = false;
  mine: Achievement[] = [];

  get isMember(): boolean {
    return this.auth.isLoggedIn() && this.auth.hasMemberRecord();
  }

  ngOnInit(): void {
    if (!this.isMember) return;
    this.service.mine().pipe(catchError(() => of([] as Achievement[]))).subscribe(list => this.mine = list);
  }

  ngOnDestroy(): void {
    if (this.preview) URL.revokeObjectURL(this.preview);
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.file = file;
    this.preview = file ? URL.createObjectURL(file) : null;
  }

  submit(): void {
    if (!this.title.trim()) {
      this.snackbar.showError(this.lang.translate('achievementSubmit.errTitle'));
      return;
    }
    this.saving = true;
    this.service.submit({ title: this.title.trim(), description: this.description.trim(), profession: this.profession.trim(), organization: this.organization.trim() }, this.file)
      .subscribe({
        next: a => {
          this.saving = false;
          this.open = false;
          this.title = this.description = this.profession = this.organization = '';
          this.onFile({ target: { files: null } } as unknown as Event);
          this.mine = [a, ...this.mine];
          this.snackbar.showSuccess(this.lang.translate('achievementSubmit.submitted'));
        },
        error: err => {
          this.saving = false;
          this.snackbar.showError(err?.error?.message || this.lang.translate('achievementSubmit.saveFailed'));
        }
      });
  }
}
