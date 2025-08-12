import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MemberService, MemberCreateDto } from '../../../Services/member.service';
import { MatNativeDateModule, MatOption } from '@angular/material/core'; // or MatMomentDateModule if you prefer moment.js
import { MatDatepickerModule } from '@angular/material/datepicker';

import { SnackbarService } from '../../../Services/snackbar.service';
import { Gender } from '../../../Enums/gender.enum';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOption,
    MatSelectModule
],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',

})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private memberService: MemberService, private snackbarService: SnackbarService) { }

  ngOnInit() {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      gender: [, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],           // <-- make phone required
      batch: ['', Validators.required],           // <-- make batch required
      currentDesignation: [''],
      institute: [''],
      heighestEducation: [''],
      currentCity: ['', Validators.required],
      dob: [null]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Prepare DTO (convert date to ISO string if present)
    const formValue = this.form.value;
    const memberData: MemberCreateDto = {
      fullName: formValue.fullName,
      gender: formValue.gender,
      email: formValue.email,
      phone: formValue.phone,
      batch: formValue.batch,
      currentDesignation: formValue.currentDesignation || undefined,
      institute: formValue.institute || undefined,
      heighestEducation: formValue.heighestEducation || undefined,
      currentCity: formValue.currentCity,
      dob: formValue.dob ? new Date(formValue.dob).toISOString() : undefined
    };

    this.memberService.registerMember(memberData).subscribe({
      next: (response) => {
        this.snackbarService.showSuccess('Registration successful! 🎉');
        this.form.reset();  // optional: clear the form
        this.isSubmitting = false;
      },
      error: (err) => {
        this.snackbarService.showError('Registration failed. Please try again.');
        console.error(err);
        this.isSubmitting = false;
      }
    });
  }
}