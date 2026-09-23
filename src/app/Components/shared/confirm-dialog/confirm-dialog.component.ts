import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="confirm" [class.confirm--danger]="data.danger">
      <span class="confirm__icon" aria-hidden="true">
        <mat-icon>{{ data.danger ? 'delete_outline' : 'help_outline' }}</mat-icon>
      </span>
      <h2 mat-dialog-title class="confirm__title">{{ data.title }}</h2>
      <p class="confirm__message">{{ data.message }}</p>
      <div class="confirm__actions">
        <button type="button" class="confirm__btn confirm__btn--ghost" (click)="close(false)">{{ data.cancelText }}</button>
        <button type="button" class="confirm__btn confirm__btn--primary" (click)="close(true)">{{ data.confirmText }}</button>
      </div>
    </div>
  `,
  styles: [`
    .confirm {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-6) var(--space-5) var(--space-5);
      text-align: center;
      color: var(--color-ink-900);
    }

    .confirm__icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: var(--space-3);
      border-radius: 50%;
      background: var(--color-primary-50);
      color: var(--color-primary-600);
    }

    .confirm--danger .confirm__icon {
      background: rgba(244, 67, 54, 0.1);
      color: #c62828;
    }

    .confirm__title {
      margin: 0 0 var(--space-2);
      padding: 0;
      font: 700 var(--font-size-lg) / 1.35 var(--font-base);
      color: var(--color-ink-900);
    }

    .confirm__title::before {
      display: none;
    }

    .confirm__message {
      margin: 0;
      max-width: 340px;
      font-size: var(--font-size-sm);
      line-height: 1.6;
      color: var(--color-ink-600);
      overflow-wrap: anywhere;
      white-space: pre-line;
    }

    .confirm__actions {
      display: flex;
      gap: var(--space-2);
      width: 100%;
      margin-top: var(--space-5);
    }

    .confirm__btn {
      flex: 1;
      min-height: 42px;
      padding: 0 var(--space-4);
      border: 1px solid transparent;
      border-radius: var(--radius-pill);
      font: 600 var(--font-size-sm) / 1 var(--font-base);
      cursor: pointer;
      transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .confirm__btn:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--color-primary-200);
    }

    .confirm__btn--ghost {
      background: transparent;
      border-color: var(--color-ink-200);
      color: var(--color-ink-700);
    }

    .confirm__btn--ghost:hover {
      background: var(--color-ink-100);
    }

    .confirm__btn--primary {
      background: var(--color-primary-800);
      color: #fff;
    }

    .confirm__btn--primary:hover {
      background: var(--color-primary-700);
    }

    .confirm--danger .confirm__btn--primary {
      background: #c62828;
    }

    .confirm--danger .confirm__btn--primary:hover {
      background: #b71c1c;
    }

    .confirm--danger .confirm__btn--primary:focus-visible {
      box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.3);
    }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<ConfirmDialogComponent, boolean>);

  close(result: boolean): void {
    this.ref.close(result);
  }
}
