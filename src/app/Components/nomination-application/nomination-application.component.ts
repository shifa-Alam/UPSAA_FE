import { Component, OnInit } from '@angular/core';
import { Candidate, CandidateService } from '../../Services/candidate.service';
import { Position, PositionService } from '../../Services/position.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Member, MemberService } from '../../Services/member.service';
import html2canvas from 'html2canvas';
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
  member: Member | undefined;
  profileImageUrl: string | undefined;
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
    { phone: '', memberId: '' },
    { phone: '', memberId: '' },
    { phone: '', memberId: '' }
  ];


  candidateName: string = '';
  postName: string = '';
  updateMessage: string = '';
  commissionerName: string = 'প্রধান নির্বাচন কমিশনার, UPSAA';

  importantDates: string[] = [
    '২৮ ফেব্রুয়ারি ২০২৬: প্রার্থীতা চূড়ান্ত',
    '১লা মার্চ ২০২৬: ব্যালট নাম্বার প্রকাশ',
    '১৩ মার্চ ২০২৬: ভোট গ্রহণ ও ফল প্রকাশ'
  ];
  selectedPositionName: string = '';

  constructor(

    private candidateService: CandidateService,
    private snackbarService: SnackbarService,
    private positionService: PositionService,
    private memberService: MemberService,

  ) { }
  ngOnInit(): void {
    this.loadPositions();
    this.loadProfile();
  }
  loadProfile() {
    this.loading = true
    this.memberService.getProfile().subscribe({
      next: res => {
        this.profileImageUrl = res?.photo ? res.photo + '?t=' + new Date().getTime() : '';
        this.member = res;
      },
      error: () => {
        this.profileImageUrl = '';
      },
      complete: () => this.loading = false
    });
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
    const filled = this.supporters.filter(s => s.phone && s.memberId);

    // Join them into a single string
    this.candidate.applicationReason = filled
      .map(s => `${s.phone}-${s.memberId}`)
      .join(', ');
  }
  addSupporter() {
    if (this.supporters.length < 5) {  // max 5 supporters
      this.supporters.push({ phone: '', memberId: '' });
    }
  }
  onPositionChange(selectedId: any) {
    const pos = this.positions.find(p => p.id == selectedId);
    this.selectedPositionName = pos ? pos.name : '';
  } submitNomination() {
    if (!this.candidate.positionId) {

      this.snackbarService.showError('Please select a position.');
      return;
    }
    this.updateApplicationReason();


    this.loading = true;

    this.candidateService.applyNomination(this.candidate).subscribe({
      next: () => {
        this.showPopup = true;
        // this.snackbarService.showSuccess('Nomination submitted successfully 🎉');
        // Allow Angular to render the modal
        setTimeout(() => {
          this.downloadJPG(); // auto-download after modal shows
        }, 100);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackbarService.showError(err?.error?.message);
      },

    });

  }



  closePopup() {
    this.showPopup = false;
  }

  downloadJPG() {
    const card = document.getElementById('greetingCard');
    if (!card) return;

    html2canvas(card, { scale: 4 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${this.member?.fullName}-nomination.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);

      // Automatically trigger download
      link.click();
    });
  }
}