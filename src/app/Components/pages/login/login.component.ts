import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  errorMessage = '';
  loading = false;
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize form here, after fb is available
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/members']); // redirect after login
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed';
      }
    });
  }
}
