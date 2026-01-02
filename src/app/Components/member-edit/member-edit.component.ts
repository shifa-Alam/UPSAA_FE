import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions, MatDialog, MatDialogTitle } from '@angular/material/dialog';
import { Member, MemberService } from '../../Services/member.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {  MatProgressBarModule } from "@angular/material/progress-bar";

import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../Services/snackbar.service';
@Component({
  selector: 'app-member-edit',
  standalone: true,
  imports: [FormsModule, CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogContent, MatDialogActions, MatDialogTitle, MatSlideToggleModule, MatProgressBarModule],
  templateUrl: './member-edit.component.html',
  styleUrl: './member-edit.component.scss'
})
export class MemberEditComponent {
  memberData: Member;
  submitting: boolean = false;

  constructor(
    private memberService: MemberService,
    private snackBar: SnackbarService,
    public dialogRef: MatDialogRef<MemberEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Member
  ) {
    this.memberData = { ...data }; // clone to edit safely
  }

  save() {
    this.submitting = true;
    // call API to save changes
    this.memberService.updateMember(this.memberData).subscribe({
      next: res => {
        // ✅ Success message
        this.snackBar.showSuccess('Profile updated successfully!');

        //this.dialogRef.close(this.memberData);
      },
      error: (err) => {
        this.snackBar.showError(err?.error?.message || 'Failed to update Profile. Try again.');

      },
      complete: () => this.submitting = false
    });


  }

  cancel() {
    this.dialogRef.close();
  }
}
