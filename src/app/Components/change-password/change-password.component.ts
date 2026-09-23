import { Component } from '@angular/core';
import { MatDialogRef, MatDialogActions, MatDialogContent, MatDialogModule, MatDialogTitle } from '@angular/material/dialog';
import { AuthService } from '../../Services/auth.service';
import { MatFormField, MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
  FormsModule,
  ReactiveFormsModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatDialogModule,   // ONLY this is needed for dialog elements
  TranslatePipe
],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  loading = false;
  passwordError = '';
  passwordSuccess = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    public dialogRef: MatDialogRef<ChangePasswordComponent>,
    private languageService: LanguageService
  ) { }

  changePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordError = this.languageService.translate('changePassword.errors.passwordsDoNotMatch');
      return;
    }

    this.loading = true;
    this.authService.changePassword({
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.passwordSuccess = this.languageService.translate('changePassword.errors.success');
      // Clear local storage / JWT
      this.authService.logout(); // implement logout in your AuthService
      // Redirect to login page
      setTimeout(() => {
        this.dialogRef.close();
        this.router.navigate(['/login']);
      }, 1000);
      },
      error: (err) => {
        this.passwordError = err?.error?.message || this.languageService.translate('changePassword.errors.changeFailed');
      },
      complete: () => this.loading = false
    });
  }
}