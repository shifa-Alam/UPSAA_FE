import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA , MatDialogRef } from '@angular/material/dialog';
import { MemberFeeAmountPipe } from '../../Pipes/member-fee-amount.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatCardAvatar, MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

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
constructor(
    @Inject(MAT_DIALOG_DATA) public member: any,
    private dialogRef: MatDialogRef<MemberDetailsComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
