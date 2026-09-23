import { Component, Inject, inject } from '@angular/core';
import { ConfirmService } from '../../Services/confirm.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MemberFeeAmountPipe } from '../../Pipes/member-fee-amount.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatCardAvatar, MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Services/auth.service';
import { MemberService } from '../../Services/member.service';
import { MatLabel, MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-member-details',
  standalone: true,
  imports: [
    MatButtonModule,
    FormsModule,
    MatCardModule,
    CommonModule,
    MatIconModule,
    MemberFeeAmountPipe,
    MatLabel,
    MatFormField,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    TranslatePipe,
    MatTooltipModule,
  ],
  templateUrl: './member-details.component.html',
  styleUrl: './member-details.component.scss'
})
export class MemberDetailsComponent {
  private confirmService = inject(ConfirmService);
hidePassword = true; // default hide
  isLoading = false;
  showPasswordInput: any;
  newPassword: any;
  passwordMessage: any;


  constructor(
    @Inject(MAT_DIALOG_DATA) public member: any,
    private dialogRef: MatDialogRef<MemberDetailsComponent>,
    private memberService: MemberService,
    public authService: AuthService,
    private snackBar: SnackbarService,
    private languageService: LanguageService
  ) { }
 changePassword() {
  if (!this.newPassword) return;
  this.isLoading = true;
  this.passwordMessage = '';

  const phoneOrEmail = this.member.email || this.member.phone;

  this.authService.setUserPassword(phoneOrEmail, this.newPassword)
    .subscribe({
      next: (res: any) => {
        this.passwordMessage = res.message;
       
        this.newPassword = '';
        this.showPasswordInput = false; // hide input after success
        this.isLoading = false;
        this.snackBar.showSuccess(
          this.passwordMessage
        );
      },
      error: (err) => {
        this.passwordMessage = err.error?.message || this.languageService.translate('memberDetails.setPasswordError');
       
        this.isLoading = false;
        this.snackBar.showError(
          this.passwordMessage
        );
      }
    });
}
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
        alert(this.languageService.translate('memberDetails.activationRequestSuccess'));
      },
      error: () => {
        this.isLoading = false;
        alert(this.languageService.translate('memberDetails.activationRequestError'));
      }
    });
  }

  approveActivation(): void {
    this.isLoading = true;
    this.memberService.approveRequest(this.member.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.member.active = true;
        alert(this.languageService.translate('memberDetails.memberActivateSuccess'));
      },
      error: () => {
        this.isLoading = false;
        alert(this.languageService.translate('memberDetails.memberActivateError'));
      }
    });
  }

  rejectActivation(): void {
    this.confirmService.ask({ message: this.languageService.translate('memberDetails.rejectConfirm'), danger: true }).subscribe(ok => {
      if (!ok) return;

      this.isLoading = true;
      this.memberService.rejectRequest(this.member.id).subscribe({
        next: () => {
          this.isLoading = false;
          alert(this.languageService.translate('memberDetails.rejectSuccess'));
        },
        error: () => {
          this.isLoading = false;
          alert(this.languageService.translate('memberDetails.rejectError'));
        }
      });
    });
  }


  createUser(memberId: number) {
    this.confirmService.ask({ message: this.languageService.translate('memberDetails.createUserConfirm') }).subscribe(ok => {
      if (!ok) return;
      this.memberService.createUserFromMember(memberId).subscribe({
        next: (res) => {
          console.log('User created:', res);
          alert(`${this.languageService.translate('memberDetails.createUserSuccessPrefix')} ${res.userName} ${this.languageService.translate('memberDetails.createUserSuccessSuffix')}`);
        },
        error: (err) => {
          console.error('Error creating user:', err);
          alert(err.error?.message || this.languageService.translate('memberDetails.createUserError'));
        }
      });
    });
  }
}