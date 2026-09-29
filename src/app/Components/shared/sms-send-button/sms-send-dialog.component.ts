import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../Services/language.service';
import { smsParts } from '../../../Services/sms.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

export interface SmsSendDialogData {
  title: string;
  /** People it reaches, and SMS left this month (null = not known). */
  reach: number;
  left: number | null;
  /** Editable text (birthday wish); omit for notices/events, whose text is fixed. */
  text?: string;
  maxLength?: number;
  /** Offer "later" with a date-time. */
  allowLater?: boolean;
  /** Already sent — say so. */
  again?: boolean;
}

export interface SmsSendDialogResult {
  /** null = now; else a Bangladesh date-time "yyyy-MM-ddTHH:mm". */
  when: string | null;
  text?: string;
}

/** "Send SMS now (or later)?" — who it reaches, what's left this month, and the text if it can be edited. */
@Component({
  selector: 'app-sms-send-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  template: `
    <div class="dlg">
      <h2 class="dlg__title">{{ data.title }}</h2>
      <p class="dlg__again" *ngIf="data.again"><mat-icon>info</mat-icon>{{ 'smsSend.alreadyNote' | translate }}</p>
      <p class="dlg__reach">
        <mat-icon>groups</mat-icon>
        <span><b>{{ num(data.reach) }}</b> {{ 'smsCompose.people' | translate }}
          <ng-container *ngIf="data.left !== null"> · {{ 'smsCompose.left' | translate }} {{ num(data.left) }}</ng-container></span>
      </p>

      <label class="dlg__field" *ngIf="text !== undefined">
        <span>{{ 'smsCompose.messageLabel' | translate }}</span>
        <textarea rows="4" [(ngModel)]="text" [maxlength]="data.maxLength ?? 600"></textarea>
        <small>{{ num(text.length) }} {{ 'smsCompose.chars' | translate }} · {{ num(parts) }} {{ 'smsCompose.parts' | translate }}</small>
      </label>

      <div class="dlg__when" *ngIf="data.allowLater" role="radiogroup" [attr.aria-label]="'smsSend.whenLabel' | translate">
        <label class="dlg__opt" [class.is-on]="!later"><input type="radio" name="when" [value]="false" [(ngModel)]="later" /> {{ 'smsSend.now' | translate }}</label>
        <label class="dlg__opt" [class.is-on]="later"><input type="radio" name="when" [value]="true" [(ngModel)]="later" /> {{ 'smsSend.later' | translate }}</label>
        <input *ngIf="later" type="datetime-local" class="dlg__time" [(ngModel)]="at" [min]="minAt" [attr.aria-label]="'smsSend.laterAt' | translate" />
      </div>

      <div class="dlg__actions">
        <button type="button" class="dlg__cancel" (click)="ref.close()">{{ 'smsSend.cancel' | translate }}</button>
        <button type="button" class="dlg__ok" [disabled]="!valid" (click)="ok()">
          <mat-icon>{{ later ? 'schedule_send' : 'send' }}</mat-icon> {{ (later ? 'smsSend.schedule' : 'smsSend.sendNow') | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dlg { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
    .dlg__title { margin: 0; font-size: 20px; color: var(--color-ink-900); }
    .dlg__again, .dlg__reach { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--color-ink-700); }
    .dlg__again { padding: 8px 12px; border-radius: 10px; background: var(--color-surface-sunken); font-size: var(--font-size-sm); }
    .dlg mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .dlg__field { display: flex; flex-direction: column; gap: 6px; font-weight: 600; }
    .dlg__field textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--color-ink-200); border-radius: 10px;
      background: var(--color-surface); color: var(--color-ink-900); font: 400 var(--font-size-md) / 1.5 var(--font-base); resize: vertical; }
    .dlg__field small { font-weight: 400; color: var(--color-ink-600); }
    .dlg__when { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .dlg__opt { position: relative; display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px;
      border: 1px solid var(--color-ink-200); border-radius: 999px; font-weight: 600; cursor: pointer; }
    .dlg__opt input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
    .dlg__opt.is-on { border-color: var(--color-primary-600); background: var(--color-primary-50); color: var(--color-link); }
    .dlg__time { min-height: 40px; padding: 0 10px; border: 1px solid var(--color-ink-200); border-radius: 10px;
      background: var(--color-surface); color: var(--color-ink-900); font: inherit; }
    .dlg__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
    .dlg__cancel, .dlg__ok { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 18px;
      border-radius: 999px; font: 600 var(--font-size-sm) / 1 var(--font-base); cursor: pointer; }
    .dlg__cancel { border: 1px solid var(--color-ink-200); background: transparent; color: var(--color-ink-700); }
    .dlg__ok { border: 0; background: var(--color-primary-600); color: #fff; }
    .dlg__ok:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class SmsSendDialogComponent {
  readonly data: SmsSendDialogData = inject(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<SmsSendDialogComponent, SmsSendDialogResult>);
  private lang = inject(LanguageService);

  text: string | undefined = this.data.text;
  later = false;
  /** Default "later": tomorrow 10:00 AM, Bangladesh. */
  at = SmsSendDialogComponent.bdLocal(new Date(new Date().setHours(0, 0, 0, 0) + 34 * 3600e3));
  readonly minAt = SmsSendDialogComponent.bdLocal(new Date(Date.now() + 2 * 60e3));

  get parts(): number {
    return smsParts((this.text ?? '').trim());
  }

  get valid(): boolean {
    if (this.text !== undefined && !this.text.trim()) return false;
    if (this.data.left !== null && this.data.reach > this.data.left) return false;
    return !this.later || (!!this.at && this.at >= this.minAt);
  }

  ok(): void {
    if (!this.valid) return;
    this.ref.close({ when: this.later ? this.at : null, text: this.text?.trim() });
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  /** A moment as Bangladesh wall-clock "yyyy-MM-ddTHH:mm" (the API reads times as Bangladesh time). */
  static bdLocal(d: Date): string {
    return new Date(d.getTime() + 6 * 3600e3).toISOString().slice(0, 16);
  }
}
