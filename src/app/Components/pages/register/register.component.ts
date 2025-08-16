import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormsModule, FormControl } from '@angular/forms';
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

import { ReplaySubject, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
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
    MatProgressBarModule,

  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
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

  batchYears: number[] = [];
  filteredBatches: ReplaySubject<number[]> = new ReplaySubject<number[]>(1);
  batchFilterCtrl: FormControl = new FormControl('', { nonNullable: true });

  totalAmount = 0;

  private _onDestroy = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService,
    private router: Router,
    private dataService: DataService
  ) { }

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    for (let y = 2003; y <= currentYear; y++) {
      this.batchYears.push(y);
    }


    this.filteredBatches.next(this.batchYears.slice());

    this.batchFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterBatchYears();
      });






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
      ),
      // Member Fees
      memberFees: this.fb.array([
        this.fb.group({
          feeType: ['Membership'],
          amount: [100, [Validators.required, Validators.min(0)]]
        }),

        this.fb.group({
          feeType: ['Donation'],
          amount: [0, [Validators.required, Validators.min(0)]]
        }),
      ])
    });

    // Calculate total dynamically
    this.memberFees.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => this.calculateTotal());

    this.calculateTotal();
  }

  get educationRecords(): FormArray {
    return this.form.get('educationRecords') as FormArray;
  }
  get memberFees(): FormArray {
    return this.form.get('memberFees') as FormArray;
  }

  private filterBatchYears() {
    const search = this.batchFilterCtrl.value?.toString()?.trim();
    if (search && this.batchYears.includes(+search)) {
      this.form.get('batch')?.setValue(+search);
    }

    this.filteredBatches.next(
      this.batchYears.filter(batch => batch.toString().toLowerCase().includes(search))
    );
  }
  calculateTotal() {
    this.totalAmount = this.memberFees.controls.reduce((sum, ctrl) => {
      return sum + Number(ctrl.value.amount || 0);
    }, 0);
  }
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.loadingService.show();
    const formValue = this.form.value;


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
      educationRecords: this.getCompletedEducationRecords(),
      fees: this.getSelectedFees()
    };
    console.log(`member data: ${JSON.stringify(memberData)}`);


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
        this.snackbarService.showError(err.error.message);

        this.isSubmitting = false;
      }
    });
  }
  private getCompletedEducationRecords(): any[] {
    return this.form.value.educationRecords.filter((edu: any) => edu.isCompleted);
  }
  private getSelectedFees(): any[] {
    return this.form.value.memberFees;
  }
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
