import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  // Generic method to show snackbar
  show(message: string, action = 'Close', config?: MatSnackBarConfig) {
    this.snackBar.open(message, action, {
      duration: 20000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      ...config
    });
  }

  showSuccess(message: string) {
    this.show(message, 'Close', { panelClass: ['snackbar-success'] });
  }

  showError(message: string) {
    this.show(message, 'Close', { panelClass: ['snackbar-error'] });
  }
}
