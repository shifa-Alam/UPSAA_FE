import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { LanguageService } from '../../../Services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, TranslatePipe
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  errorMessage = '';
  loading = false;
  loginForm: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private languageService: LanguageService
  ) {
    // Initialize form here, after fb is available
    this.loginForm = this.fb.group({
      // email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  submit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { phone, password } = this.loginForm.value;

    this.authService.login(phone!, password!).subscribe({
      next: () => {
        this.loading = false;

        if (this.authService.isStaff()) {
          this.router.navigate(['/dashboard/home']); // back-office welcome screen
        } else {
          this.router.navigate(['/portal/home']); // alumni portal welcome screen
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || this.languageService.translate('login.errors.loginFailed');
      }
    });
  }
}
