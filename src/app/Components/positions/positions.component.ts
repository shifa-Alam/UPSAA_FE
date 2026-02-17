import { Component, OnInit } from '@angular/core';
import { Position, PositionService } from '../../Services/position.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Election, ElectionService } from '../../Services/election.service';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.scss'
})
export class PositionsComponent implements OnInit {
  viewDetails(_t20: Position) {
    throw new Error('Method not implemented.');
  }
  loading = false;
  positions: Position[] = [];
  pagedPositions: Position[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  showModal = false;
  editMode = false;
  modalPosition: Position = {
    id: 0, name: '',
    electionTitle: '',
    electionId: 0, maxSelect: 0,
    priority: 0,
    fee: 0,
    candidates: []
  };
  elections: Election[] = [];
  constructor(private positionService: PositionService, private electionService: ElectionService) {

  }

  ngOnInit() {
    // Dummy data
    this.loadPositionss();
    this.loadElections();
  }
  loadElections() {
    this.electionService.getElections().subscribe({
      next: res => this.elections = res,
      error: err => console.error(err)
    });
  }
  filterPositionss() {
    this.currentPage = 1;
    this.calculatePages();
  }
  loadPositionss() {
    this.loading = true;
    this.positionService.getPositions()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.positions = data.map((el, i) => ({
            id: el.id,
            name: el.name,
            electionTitle: el.electionTitle,
            electionId: el.electionId,
            maxSelect: el.maxSelect,
            priority: el.priority,
            fee: el.fee,
            candidates: []
          }));
          this.calculatePages(); // pagination
        },
        error: (err) => {
          console.error('Failed to fetch positions:', err);
          alert('Failed to load positions. Please try again.');
        }
      });
  }
  calculatePages() {
    const filtered = this.positions.filter(e =>
      e.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.pagedPositions = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
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

  openAddPositionModal() {
    this.editMode = false;
    this.modalPosition = { id: 0, name: '', electionTitle: '', electionId: 0, maxSelect: 0, priority: 0, fee: 0, candidates: [] };
    this.showModal = true;
  }

  editPosition(e: Position) {

    this.editMode = true;
    this.modalPosition = { ...e };


    this.showModal = true;
  }

  deletePosition(e: Position) {

    this.positionService.deletePosition(e.id).subscribe({
      next: (updated) => {
        this.positions = this.positions.filter(el => el.id !== e.id);
        this.calculatePages();
        // Update existing position
      },
      error: (err) => {
        console.error('delete failed:', err);
        alert('Failed to delete position.');
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }

  submitPosition() {
    if (!this.modalPosition.name || !this.modalPosition.electionId || !this.modalPosition.maxSelect) return;

    if (this.editMode) {
      // Update existing position
      this.positionService.updatePosition(this.modalPosition).subscribe({
        next: (updated) => {
          const index = this.positions.findIndex(el => el.id === updated.id);
          if (index !== -1) this.positions[index] = updated;
          this.calculatePages();
          this.closeModal();
        },
        error: (err) => {
          console.error('Update failed:', err);
          alert('Failed to update position.');
        }
      });
    } else {
      // Add new position
      this.positionService.addPosition(this.modalPosition).subscribe({
        next: (created) => {
          this.positions.push(created);
          this.calculatePages();
          this.closeModal();
        },
        error: (err) => {
          console.error('Add failed:', err);
          alert('Failed to add position.');
        }
      });
    }
  }

}