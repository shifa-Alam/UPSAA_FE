import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../Components/shared/confirm-dialog/confirm-dialog.component';
import { LanguageService } from './language.service';

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  /** Red confirm button and delete icon — for destructive actions. */
  danger?: boolean;
}

/** Styled replacement for window.confirm(). Emits true only when the user confirms. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private dialog = inject(MatDialog);
  private lang = inject(LanguageService);

  ask(options: ConfirmOptions): Observable<boolean> {
    const t = (k: string) => this.lang.translate(`confirmDialog.${k}`);
    const danger = options.danger ?? false;
    const data: ConfirmDialogData = {
      message: options.message,
      title: options.title ?? t(danger ? 'deleteTitle' : 'title'),
      confirmText: options.confirmText ?? t(danger ? 'delete' : 'confirm'),
      cancelText: options.cancelText ?? t('cancel'),
      danger
    };
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data,
        width: '400px',
        autoFocus: 'dialog',
        restoreFocus: true
      })
      .afterClosed()
      .pipe(map(result => result === true));
  }

  /** Confirmation for deleting a named item: `"<name>" <question>`. */
  askDelete(name: string, question: string): Observable<boolean> {
    return this.ask({ message: `"${name}" ${question}`, danger: true });
  }
}
