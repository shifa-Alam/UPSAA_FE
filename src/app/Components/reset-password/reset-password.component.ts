import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../Services/auth.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';


@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  email!: string;
  token!: string;
  newPassword = '';
  message = '';
  isSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private languageService: LanguageService
  ) {}

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email')!;
    this.token = this.route.snapshot.queryParamMap.get('token')!;
  }

  onSubmit() {
    if (!this.newPassword) {
      this.message = this.languageService.translate('resetPassword.errors.passwordRequired');
      return;
    }

    this.authService.resetPassword(this.email, this.token, this.newPassword).subscribe({
      next: (res: any) => {
        this.isSuccess = true;
        this.message = this.languageService.translate('resetPassword.errors.success');
      },
      error: (err) => {
        this.isSuccess = false;
        this.message = this.languageService.translate('resetPassword.errors.invalidOrExpiredLink');
      }
    });
  }
}
