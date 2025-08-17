import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MemberFeeAmountPipe } from '../../Pipes/member-fee-amount.pipe';

@Component({
  selector: 'app-member-details',
  standalone: true,
  imports: [MemberFeeAmountPipe],
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
