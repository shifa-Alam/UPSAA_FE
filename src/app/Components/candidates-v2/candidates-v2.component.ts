import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Candidate, CandidateFilterDto, CandidateService } from '../../Services/candidate.service';

@Component({
  selector: 'app-candidates-v2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidates-v2.component.html',
  styleUrl: './candidates-v2.component.scss'
})
export class CandidatesV2Component implements OnInit {
  batch: number | null | undefined;
  modalCandidate: Candidate | undefined;
  selectedCandidate: Candidate | undefined | null;
  showDetailsModal = false;
  showRejectNote = false;
  rejectNote: string = '';

  loading = false;
  candidates: Candidate[] = [];

  showModal = false;
  editMode = false;
  totalItems = 0;
  totalPages = 0;
  pageNumber = 1;
  pageSize = 10;
  // For filters
  filter: CandidateFilterDto = {
    pageNumber: 1,
    pageSize: 10
  };
  constructor(private candidateService: CandidateService) {

  }

  ngOnInit() {
    this.initFilter();
    this.loadCandidates();
  }
  initFilter() {
    this.filter.pageNumber = 1;

  }
  filterCandidates() {

    this.calculatePages();
  }
  loadCandidates() {
    this.loading = true;
    this.candidateService.loadCandidates(this.filter).subscribe({
      next: (res) => {
        this.candidates = res.candidates;

        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
        this.pageNumber = res.pageNumber;
        this.totalMembershipAmount = res.totalMembershipAmount;
        this.totalDonationAmount = res.totalDonationAmount;
        this.totalAmount = res.totalAmount;
        this.loading = false; // Hide loader
      },
      error: () => {
        this.loading = false; // Hide loader even on error
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