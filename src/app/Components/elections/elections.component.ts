import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Election, ElectionService } from '../../Services/election.service';

@Component({
  selector: 'app-elections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './elections.component.html',
  styleUrl: './elections.component.scss'
})
export class ElectionsComponent implements OnInit {
  elections: Election[] = [];
  pagedElections: Election[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  showModal = false;
  editMode = false;
  modalElection: Election = { id: 0, title: '', startTime: '', endTime: '' };

  constructor(private electionService: ElectionService) {

  }

  ngOnInit() {
    // Dummy data
    this.loadElections();
  }

  filterElections() {
    this.currentPage = 1;
    this.calculatePages();
  }
  loadElections() {
    this.electionService.getElections().subscribe({
      next: (data) => {
        this.elections = data.map((el, i) => ({
          id: el.id,
          title: el.title,
          startTime: el.startTime,
          endTime: el.endTime
        }));
        this.calculatePages(); // pagination
      },
      error: (err) => {
        console.error('Failed to fetch elections:', err);
        alert('Failed to load elections. Please try again.');
      }
    });
  }
  calculatePages() {
    const filtered = this.elections.filter(e =>
      e.title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.pagedElections = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
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

  openAddElectionModal() {
    this.editMode = false;
    this.modalElection = { id: 0, title: '', startTime: '', endTime: '' };
    this.showModal = true;
  }

  editElection(e: Election) {
    console.log(e);
    this.editMode = true;
    this.modalElection = { ...e };

    // Convert dates to yyyy-MM-dd
    this.modalElection.startTime = this.formatDate(this.modalElection.startTime);
    this.modalElection.endTime = this.formatDate(this.modalElection.endTime);
    this.showModal = true;
  }
  formatDate(date: string | Date): string {
    const d = new Date(date);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${d.getFullYear()}-${month}-${day}`;
  }
  deleteElection(e: Election) {
    this.elections = this.elections.filter(el => el.id !== e.id);
    this.calculatePages();
  }

  closeModal() {
    this.showModal = false;
  }

  submitElection() {
    if (!this.modalElection.title || !this.modalElection.startTime || !this.modalElection.endTime) return;

    if (this.editMode) {
      // Update existing election
      this.electionService.updateElection(this.modalElection).subscribe({
        next: (updated) => {
          const index = this.elections.findIndex(el => el.id === updated.id);
          if (index !== -1) this.elections[index] = updated;
          this.calculatePages();
          this.closeModal();
        },
        error: (err) => {
          console.error('Update failed:', err);
          alert('Failed to update election.');
        }
      });
    } else {
      // Add new election
      this.electionService.addElection(this.modalElection).subscribe({
        next: (created) => {
          this.elections.push(created);
          this.calculatePages();
          this.closeModal();
        },
        error: (err) => {
          console.error('Add failed:', err);
          alert('Failed to add election.');
        }
      });
    }
  }

}