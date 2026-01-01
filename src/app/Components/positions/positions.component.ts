import { Component, OnInit } from '@angular/core';
import { Position, PositionService } from '../../Services/position.service';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [],
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.scss'
})
export class PositionsComponent implements OnInit {
  positions: Position[] = [];
  pagedPositions: Position[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  showModal = false;
  editMode = false;
  modalPosition: Position ={
    id: 0,
    name: '',
    electionId: 0,
    electionTitle: ''
  };

  constructor(private positionService: PositionService) {

  }

  ngOnInit() {
    // Dummy data
    this.loadPositions();
  }

  filterPositions() {
    this.currentPage = 1;
    this.calculatePages();
  }
  loadPositions() {
    this.positionService.getPositions().subscribe({
      next: (data) => {
        this.positions = data;
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
      e.electionTitle.toLowerCase().includes(this.searchTerm.toLowerCase())
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
    this.modalPosition = {  id: 0,
    name: '',
    electionId: 0,
    electionTitle: '' };
    this.showModal = true;
  }

  editPosition(e: Position) {
    console.log(e);
    this.editMode = true;
    this.modalPosition = { ...e };

    
    this.showModal = true;
  }

  deletePosition(e: Position) {
    this.positions = this.positions.filter(el => el.id !== e.id);
    this.calculatePages();
  }

  closeModal() {
    this.showModal = false;
  }

  submitPosition() {
    //if (!this.modalPosition.title || !this.modalPosition.startTime || !this.modalPosition.endTime) return;

    if (this.editMode) {
      // Update existing election
      this.positionService.updatePosition(this.modalPosition).subscribe({
        next: (updated) => {
          const index = this.positions.findIndex(el => el.id === updated.id);
          if (index !== -1) this.positions[index] = updated;
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
      this.positionService.addPosition(this.modalPosition).subscribe({
        next: (created) => {
          this.positions.push(created);
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