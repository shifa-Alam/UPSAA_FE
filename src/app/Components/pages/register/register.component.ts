import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule,MatCardModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  // register.component.ts
  formBuilder: FormBuilder | undefined;
  form: FormGroup;
  constructor(private fb: FormBuilder) {
   this.form = this.fb.group({
  name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  phone: ['', Validators.required],
  year: ['', Validators.required],
  institute: ['', Validators.required],
  designation: ['', Validators.required],
  city: ['', Validators.required],
});

  }

  onSubmit() {
    console.log(this.form.value);
  }
}
