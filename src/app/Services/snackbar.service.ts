import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) { }

  // Generic method to show snackbar
  private errShow(message: string, action = 'Close') {
    this.snackBar.open(message, action, {
      duration: 20000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-error']
    });
  }
  private successShow(message: string, action = 'OK', config?: MatSnackBarConfig) {
    this.snackBar.open(message, action, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success'],
      ...config
    });
  }
  showSuccess(message: string) {
    this.successShow(message, 'Close', { panelClass: ['snackbar-success'] });
  }

  showError(message: string) {
    this.errShow(message);
  }
}
