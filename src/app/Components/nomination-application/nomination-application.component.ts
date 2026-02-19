import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Candidate, CandidateService } from '../../Services/candidate.service';
import { Position, PositionService } from '../../Services/position.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { CandidateAddComponent } from '../candidate-add/candidate-add.component';
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-nomination-application',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  templateUrl: './nomination-application.component.html',
  styleUrl: './nomination-application.component.scss'
})
export class NominationApplicationComponent implements OnInit {
  showPopup = false;
  candidate: Candidate = {
    id: 0,
    positionId: 0,
    positionName: '',
    memberId: 0,
    memberName: '',
    adminNote: '',
    applicationReason: '',
    ballotNumber: 0,
    batch: 0,
    nominationStatus: 'Pending',
  };
  loading = false;

  positions: Position[] = [];
  // Initialize supporter array
  supporters = [
    { name: '', batch: '', memberId: '' },
    { name: '', batch: '', memberId: '' },
    { name: '', batch: '', memberId: '' }
  ];
  constructor(

    private candidateService: CandidateService,
    private snackbarService: SnackbarService,
    private positionService: PositionService,

  ) { }
  ngOnInit(): void {
    this.loadPositions();
  }
  loadPositions() {
    this.positionService.getPositions().subscribe({
      next: res => this.positions = res,
      error: err => console.error(err)
    });
  }
  // Call this before submit
  updateApplicationReason() {
    // Filter out empty supporters
    const filled = this.supporters.filter(s => s.name && s.batch && s.memberId);

    // Join them into a single string
    this.candidate.applicationReason = filled
      .map(s => `${s.name}-${s.batch}-${s.memberId}`)
      .join(', ');
  }
  addSupporter() {
    if (this.supporters.length < 5) {  // max 5 supporters
      this.supporters.push({ name: '', batch: '', memberId: '' });
    }
  }
  submitNomination() {
    if (!this.candidate.positionId) {

      this.snackbarService.showError('Please select a position.');
      return;
    }
    this.updateApplicationReason();


    this.loading = true;
    console.log(this.candidate);
    this.candidateService.applyNomination(this.candidate).subscribe({
      next: () => {

        this.snackbarService.showSuccess('Nomination submitted successfully 🎉');
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackbarService.showError(err?.error?.message);
      },

    });
  }

  closePopup() {

  }

}