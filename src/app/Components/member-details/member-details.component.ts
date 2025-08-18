import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MemberFeeAmountPipe } from '../../Pipes/member-fee-amount.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatCardAvatar, MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Services/auth.service';
import { MemberService } from '../../Services/member.service';

@Component({
  selector: 'app-member-details',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatIconModule,
    MemberFeeAmountPipe
  ],
  templateUrl: './member-details.component.html',
  styleUrl: './member-details.component.scss'
})
export class MemberDetailsComponent {
  isLoading = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public member: any,
    private dialogRef: MatDialogRef<MemberDetailsComponent>,
    private memberService: MemberService,
    public authService: AuthService
  ) { }

  close() {
    this.dialogRef.close();
  }
  isRepresentative(): boolean {
    return this.authService.hasRole('Representative');
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole('SuperAdmin');
  }

  requestActivation(): void {
    this.isLoading = true;
    this.memberService.requestActivation(this.member.id).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Activation request sent successfully.');
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to send activation request.');
      }
    });
  }

  approveActivation(): void {
    this.isLoading = true;
    this.memberService.approveRequest(this.member.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.member.active = true;
        alert('Member activated successfully.');
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to activate member.');
      }
    });
  }

  rejectActivation(): void {
    if (!confirm('Are you sure you want to reject this activation request?')) return;

    this.isLoading = true;
    this.memberService.rejectRequest(this.member.id).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Activation request rejected.');
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to reject request.');
      }
    });
  }


  createUser(memberId: number) {
    const confirmed = confirm('Are you sure you want to create this user?');
    if (!confirmed) return;
    this.memberService.createUserFromMember(memberId).subscribe({
      next: (res) => {
        console.log('User created:', res);
        alert(`User created successfully for member ${res.userName}`);
      },
      error: (err) => {
        console.error('Error creating user:', err);
        alert(err.error?.message || 'Failed to create user');
      }
    });
  }
}