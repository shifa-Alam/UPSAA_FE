import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../Services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Init } from 'node:v8';
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatOption } from "@angular/material/core";

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent implements OnInit {
  step: number = 1;
  otpCountdown = 0;
  otpInterval: any;
  phoneNumber: string = '';
  batch: number = 0;
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';

  batchYears: number[] = [];
  constructor(private authService: AuthService) { }
  ngOnInit() {
    const startYear = 2003;
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= startYear; year--) {
      this.batchYears.push(year);
    }
  }

  loading: boolean = false;
  isError: boolean = false;
  startOtpCountdown() {
    this.otpCountdown = 60; // 60 seconds
    this.otpInterval = setInterval(() => {
      this.otpCountdown--;
      if (this.otpCountdown <= 0) clearInterval(this.otpInterval);
    }, 1000);
  }

  canResendOtp(): boolean {
    return this.otpCountdown <= 0;
  }

  resendOtp() {
    if (!this.canResendOtp()) return;
    this.sendOtp();
  }
  sendOtp() {
    if (!this.phoneNumber || !this.batch) {
      this.message = "Please enter phone number and batch.";
      this.isError = true;
      return;
    }

    this.loading = true;
    this.authService.sendOtp(this.phoneNumber, this.batch).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.step = 2; // move to OTP step
        this.message = res.message || "OTP sent successfully.";
        this.isError = false;
        this.startOtpCountdown(); // optional: start resend timer
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || "Failed to send OTP.";
        this.isError = true;
      }
    });
  }

  verifyOtp() {
    if (!this.otp || this.otp.length !== 6) {
      this.message = "OTP must be 6 digits.";
      this.isError = true;
      return;
    }

    this.loading = true;
    this.authService.verifyOtp(this.phoneNumber, this.otp).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.step = 3; // move to password reset
        this.message = res.message || "OTP verified successfully.";
        this.isError = false;
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || "Invalid or expired OTP.";
        this.isError = true;
      }
    });
  }

  resetPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.message = "Please enter password and confirm password.";
      this.isError = true;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.message = "Passwords do not match.";
      this.isError = true;
      return;
    }

    this.loading = true;
    this.authService.resetPasswordWithOtp(this.phoneNumber, this.newPassword).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message || "Password reset successful. Please login.";
        this.isError = false;
        this.step = 1; // reset back to first step
        this.otp = "";
        this.newPassword = "";
        this.confirmPassword = "";
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || "Failed to reset password.";
        this.isError = true;
      }
    });
  }
}