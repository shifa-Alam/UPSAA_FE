import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Candidate, CandidateFilterDto, CandidateService } from '../../Services/candidate.service';
import { Position, PositionService } from '../../Services/position.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';

import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-candidates-v2',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, FormsModule, MatSlideToggleModule, MatIconModule, AdminHeaderComponent, SectionCardComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './candidates-v2.component.html',
  styleUrl: './candidates-v2.component.scss'
})
export class CandidatesV2Component implements OnInit {
  positions: Position[] = [];
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
    pageSize: 10,
    isPaid: null,
    positionId: 0,
    nominationStatusId: null
  };
  totalFee: number = 0;
  paidFee: number = 0;
  constructor(private candidateService: CandidateService, private positionService: PositionService, private languageService: LanguageService) {

  }

  ngOnInit() {
    this.initFilter();
    this.loadPositions();
    this.loadCandidates();
  }
  loadPositions() {
    this.loading = true;
    this.positionService.getPositions().subscribe({
      next: (data) => {
        this.positions = data.map((el, i) => ({
          id: el.id,
          name: el.name,
          electionTitle: el.electionTitle,
          electionId: el.electionId,
          maxSelect: el.maxSelect,
          priority: el.priority,
          fee: el.fee,

        }));

      },
      error: (err) => {
        console.error('Failed to fetch positions:', err);

      }
    });
  }
  initFilter() {
    this.filter.pageNumber = 1;

  }
  loadCandidates() {
    this.loading = true;
    this.candidateService.filterCandidates(this.filter).subscribe({
      next: (res) => {
        this.candidates = res.candidates;

        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
        this.pageNumber = res.pageNumber;
        this.totalFee = res.totalFee;
        this.paidFee = res.paidFee;
        this.loading = false; // Hide loader
      },
      error: () => {
        this.loading = false; // Hide loader even on error
      }
    });
  }
  getMiddlePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(2, this.pageNumber - 1);
    const end = Math.min(this.totalPages - 1, this.pageNumber + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
  setPageSize() {
    if (typeof window !== 'undefined') {
      this.pageSize = window.innerWidth < 768 ? 5 : 20;
    }
  }
  onPageChange(page: number) {
    this.filter.pageNumber = page;
    this.loadCandidates();
  }
  applyFilter() {
    this.loadCandidates(); // Reset to first page whenever filter changes
  }
  // ✅ Add this method
  resetFilters() {
    this.filter = {
      pageNumber: 1,
      pageSize: this.pageSize,
      isPaid: null,
      positionId: 0,
      nominationStatusId: null
    };
    this.loadCandidates();
  }
  viewDetails(candidate: Candidate) {
    this.selectedCandidate = candidate;
    this.showDetailsModal = true;
  }

  statusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'Pending':
        return this.languageService.translate('candidates.statusPending');
      case 'Approved':
        return this.languageService.translate('candidates.statusApproved');
      case 'Rejected':
        return this.languageService.translate('candidates.statusRejected');
      case 'Withdrawn':
        return this.languageService.translate('candidates.statusWithdrawn');
      default:
        return status || '';
    }
  }

  /** Soft pill tint for a nomination status (presentation only). */
  nominationPillClass(status: string | null | undefined): string {
    switch (status) {
      case 'Approved':
        return 'pill--success';
      case 'Rejected':
        return 'pill--danger';
      case 'Pending':
        return 'pill--heritage';
      default:
        return '';
    }
  }

  approveCandidate(candidate: any) {

    const payload: Candidate = {
      id: candidate.id,
      positionId: candidate.positionId,
      nominationStatus: 'Approved',
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

          this.closeModal();
        },
        error: (err) => {
          console.error('Update failed:', err);
          alert(this.languageService.translate('candidates.updateErrorAlert'));
        }
      });
    } else {
      // Add new candidate
      this.candidateService.applyNomination(this.modalCandidate).subscribe({
        next: (created) => {
          this.candidates.push(created);

          this.closeModal();
        },
        error: (err) => {
          console.error('Add failed:', err);
          alert(this.languageService.translate('candidates.addErrorAlert'));
        }
      });
    }
  }
  onPaymentToggle(isPaid: boolean) {
    if (!this.selectedCandidate) return;

    const candidateId = this.selectedCandidate?.id;

    this.candidateService.updatePaymentStatus(candidateId, isPaid)
      .subscribe({
        next: () => {
          this.selectedCandidate!.isPaid = isPaid;
        },
        error: () => {
          alert(this.languageService.translate('candidates.paymentUpdateErrorAlert'));
          // revert toggle if API fails
          this.selectedCandidate!.isPaid = !isPaid;
        }
      });
  }
}