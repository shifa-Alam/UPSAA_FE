import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Candidate, CandidateService } from '../../Services/candidate.service';
import { MatOptionModule } from "@angular/material/core";

import { Position, PositionService } from '../../Services/position.service';
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { SnackbarService } from '../../Services/snackbar.service';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-candidate-add',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule, MatIconModule],
  templateUrl: './candidate-add.component.html',
  styleUrl: './candidate-add.component.scss'
})
export class CandidateAddComponent implements OnInit {

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
    nominationStatus: '',
  };
  loading = false;

  positions: Position[] = [];

  constructor(

    private candidateService: CandidateService,
    private snackbarService: SnackbarService,
    private positionService: PositionService,
    public dialogRef: MatDialogRef<CandidateAddComponent>
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
  submitNomination() {
    if (!this.candidate.positionId) {

      this.snackbarService.showError('Please select a position.');
      return;
    }


    this.loading = true;
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


  closeModal() {
    this.dialogRef.close();
  }
}