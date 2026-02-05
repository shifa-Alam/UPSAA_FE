import { Component, OnInit } from '@angular/core';
import { Candidate, CandidateService } from '../../Services/candidate.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidates.component.html',
  styleUrl: './candidates.component.scss'
})
export class CandidatesComponent implements OnInit {
  modalCandidate: Candidate | undefined;
  selectedCandidate: Candidate | undefined | null;
  showDetailsModal = false;
  showRejectNote = false;
  rejectNote: string = '';

  loading = false;
  candidates: Candidate[] = [];
  pagedCandidates: Candidate[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 15;
  totalPages = 1;

  showModal = false;
  editMode = false;

  constructor(private candidateService: CandidateService) {

  }

  ngOnInit() {
    // Dummy data
    this.loadCandidates();
  }

  filterCandidates() {
    this.currentPage = 1;
    this.calculatePages();
  }
  loadCandidates() {
    this.loading = true;
    this.candidateService.getCandidates(1)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.candidates = data.map((el, i) => ({
            id: el.id,
            positionName: el.positionName,
            memberName: el.memberName,
            ballotNumber: el.ballotNumber,
            batch: el.batch,
            positionId: el.positionId,
            memberId: el.memberId,
            adminNote: el.adminNote,
            applicationReason: el.applicationReason,
            nominationStatus: el.nominationStatus,
          }));
          this.calculatePages(); // pagination
        },
        error: (err) => {
          console.error('Failed to fetch candidates:', err);
          alert('Failed to load candidates. Please try again.');
        }
      });
  }
  calculatePages() {
    const filtered = this.candidates.filter(e =>
      e.memberName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.pagedCandidates = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.calculatePages();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.calculatePages();
    }
  }
  viewDetails(candidate: Candidate) {
    this.selectedCandidate = candidate;
    this.showDetailsModal = true;
  }

  approveCandidate(candidate: any) {

    const payload: Candidate = {
      id: candidate.id,
      positionId: candidate.positionId,
      positionName: candidate.positionName,

      memberId: candidate.memberId,
      memberName: candidate.memberName,

      applicationReason: candidate.applicationReason,
      ballotNumber: candidate.ballotNumber,
      batch: candidate.batch,

      nominationStatus: 'Approved',
      adminNote: null as any
    };

    this.candidateService
      .decideCandidate(candidate.id, payload)
      .subscribe({
        next: () => {
          candidate.nominationStatus = 'Approved';
          candidate.adminNote = '';
          this.resetRejectState();
        },
        error: err => console.error(err)
      });
  }


  confirmReject(candidate: any) {
    if (!this.rejectNote.trim()) return;

    const payload: Candidate = {
      ...candidate,
      nominationStatus: 'Rejected',
      adminNote: this.rejectNote
    };

    this.candidateService
      .decideCandidate(candidate.id, payload)
      .subscribe(() => {
        candidate.nominationStatus = 'Rejected';
        candidate.adminNote = this.rejectNote;
        this.resetRejectState();
      });
  }



  undoAction(candidate: any) {

    const payload: Candidate = {
      ...candidate,
      nominationStatus: 'Pending',
      adminNote: null as any
    };

    this.candidateService
      .decideCandidate(candidate.id, payload)
      .subscribe(() => {
        candidate.nominationStatus = 'Pending';
        candidate.adminNote = '';
      });
  }


  resetRejectState() {
    this.showRejectNote = false;
    this.rejectNote = '';
  }

  closeDetailsModal() {
    this.resetRejectState();
    this.selectedCandidate = null;
    this.showDetailsModal = false;
  }
  openAddCandidateModal() {
    this.editMode = false;

    this.showModal = true;
  }

  editCandidate(e: Candidate) {
    console.log(e);
    this.editMode = true;
    this.modalCandidate = { ...e };

    this.showModal = true;
  }

  deleteCandidate(e: Candidate) {
    this.candidates = this.candidates.filter(el => el.id !== e.id);
    this.calculatePages();
  }

  closeModal() {
    this.showModal = false;
  }

  submitCandidate() {
    if (!this.modalCandidate?.memberId || !this.modalCandidate.positionId || !this.modalCandidate.applicationReason) return;

    if (this.editMode) {
      // Update existing candidate
      this.candidateService.updateCandidate(this.modalCandidate).subscribe({
        next: (updated) => {
          const index = this.candidates.findIndex(el => el.id === updated.id);
          if (index !== -1) this.candidates[index] = updated;
          this.calculatePages();
          this.closeModal();
        },
        error: (err) => {
          console.error('Update failed:', err);
          alert('Failed to update candidate.');
        }
      });
    } else {
      // Add new candidate
      this.candidateService.applyNomination(this.modalCandidate).subscribe({
        next: (created) => {
          this.candidates.push(created);
          this.calculatePages();
          this.closeModal();
        },
        error: (err) => {
          console.error('Add failed:', err);
          alert('Failed to add candidate.');
        }
      });
    }
  }

}