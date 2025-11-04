import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../Services/auth.service';


@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  email!: string;
  token!: string;
  newPassword = '';
  message = '';
  isSuccess = false;

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email')!;
    this.token = this.route.snapshot.queryParamMap.get('token')!;
  }

  onSubmit() {
    if (!this.newPassword) {
      this.message = 'Please enter a new password.';
      return;
    }

    this.authService.resetPassword(this.email, this.token, this.newPassword).subscribe({
      next: (res: any) => {
        this.isSuccess = true;
        this.message = '✅ Password reset successful! You can now log in.';
      },
      error: (err) => {
        this.isSuccess = false;
        this.message = '❌ Invalid or expired link.';
      }
    });
  }
}
