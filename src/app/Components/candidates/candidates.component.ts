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
  viewDetails(_t20: Candidate) {
    throw new Error('Method not implemented.');
  }
  loading = false;
  candidates: Candidate[] = [];
  pagedCandidates: Candidate[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 20;
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
          positionId: el.positionId,
          memberId: el.memberId,
          adminNote: el.adminNote,
          applicationReason: el.applicationReason,
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