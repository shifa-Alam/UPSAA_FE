import { Component } from '@angular/core';
import { AuthService } from '../../Services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent {
email = '';
message = '';
constructor( private authService: AuthService) {}
 
onSubmit() {
  this.authService.forgotPassword(this.email).subscribe({
    next: res => this.message = 'Reset link sent to your email.',
    error: err => this.message = 'User not found or server error.'
  });
}
}
