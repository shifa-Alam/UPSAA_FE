import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MemberService, MemberCreateDto } from '../../../Services/member.service';
import { MatNativeDateModule, MatOption } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { SnackbarService } from '../../../Services/snackbar.service';
import { Router } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../../Services/loading-service.service';
import { DataService } from '../../../Services/data.service';

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
    MatSelectModule,
    MatCheckboxModule,
    MatProgressBarModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;

  educationOptions = [
    { id: 1, name: 'SSC' },
    { id: 2, name: 'HSC' },
    { id: 3, name: 'Diploma' },
    { id: 4, name: 'Bachelor' },
    { id: 5, name: 'Masters' },
    { id: 6, name: 'PGD' },
    { id: 7, name: 'PhD' }
  ];
  bloodGroups: string[] = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-'
  ];

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService,
    private router: Router,
    private dataService:DataService
  ) { }

  ngOnInit() {
    // this.loadingService.show();
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      bloodGroup: ['', Validators.required],
      gender: [, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      batch: ['', Validators.required],
      currentDesignation: [''],
      employer: [''],
      currentCity: ['', Validators.required],
      dob: [null],
      educationRecords: this.fb.array(
        this.educationOptions.map((e, index) => {
          const isSSC = index === 0; // first one is SSC

          // Initial disabled state
          const initiallyDisabled = !isSSC;

          const group = this.fb.group({
            degreeId: [e.id],
            degreeName: [e.name],
            isCompleted: [{ value: isSSC, disabled: false }], // SSC is always completed
            instituteName: [{ value: isSSC ? 'Uttaran Public School' : '', disabled: initiallyDisabled }],
            subject: [{ value: '', disabled: initiallyDisabled }]
          });

          // Enable/disable inputs dynamically (skip SSC)
          if (!isSSC) {
            group.get('isCompleted')?.valueChanges.subscribe(selected => {
              if (selected) {
                group.get('instituteName')?.enable();
                group.get('subject')?.enable();
              } else {
                group.get('instituteName')?.disable();
                group.get('instituteName')?.reset();
                group.get('subject')?.disable();
                group.get('subject')?.reset();
              }
            });
          }

          return group;
        })
      )

    });
  }

  get educationRecords(): FormArray {
    return this.form.get('educationRecords') as FormArray;
  }


  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.loadingService.show();
    const formValue = this.form.value;

    const selectedEducation = formValue.educationRecords.filter((edu: any) => edu.isCompleted);

    const memberData: MemberCreateDto = {
      fullName: formValue.fullName,
      bloodGroup: formValue.bloodGroup,
      gender: formValue.gender,
      email: formValue.email,
      phone: formValue.phone,
      batch: formValue.batch,
      currentDesignation: formValue.currentDesignation || undefined,
      employer: formValue.employer || undefined, // updated
      currentCity: formValue.currentCity,
      dob: formValue.dob ? new Date(formValue.dob).toISOString() : undefined,
      educationRecords: selectedEducation
    };

    this.memberService.registerMember(memberData).subscribe({
      next: () => {
        this.loadingService.hide();
        this.form.reset();
        this.isSubmitting = false;

        this.dataService.setMemberData(memberData);
        this.router.navigate(['/congratulations']);


      },
      error: (err) => {
        this.loadingService.hide();
        this.snackbarService.showError('Registration failed. Please try again.');

        this.isSubmitting = false;
      }
    });
  }
}
