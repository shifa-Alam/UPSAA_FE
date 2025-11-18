import { Component,Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions, MatDialog, MatDialogTitle } from '@angular/material/dialog';
import { Member } from '../../Services/member.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
@Component({
  selector: 'app-member-edit',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogContent, MatDialogActions,MatDialogTitle,MatSlideToggleModule ],
  templateUrl: './member-edit.component.html',
  styleUrl: './member-edit.component.scss'
})
export class MemberEditComponent {
  memberData: Partial<Member>;

  constructor(
     public dialogRef: MatDialogRef<MemberEditComponent>,
  @Inject(MAT_DIALOG_DATA) public data: Member
  ) {
    this.memberData = { ...data }; // clone to edit safely
  }

  save() {
    // You can emit the updated data or call API here
    this.dialogRef.close(this.memberData);
  }

  cancel() {
    this.dialogRef.close();
  }
}
