import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { CandidateBallot, PositionBallot, VoteService } from '../../Services/vote.service';
import { Position } from '../../Services/position.service';
import { Candidate } from '../../Services/candidate.service';
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from '@angular/material/progress-bar';
// type Candidate = {
//   id: string;   // <-- force string
//   name: string;
//   batch: number;
//   photoUrl?: string;
//   bio?: string;
//   extra?: string;
// };

// type Position = {
//   id: string;  // <-- force string
//   title: string;
//   maxSelect: number; // 1 for single-choice, >1 for multi
//   candidates: Candidate[];
// };

@Component({
  selector: 'app-voting-screen',
  standalone: true,
  imports: [CommonModule, MatIconModule,MatProgressBarModule],
  templateUrl: './voting-screen.component.html',
  styleUrl: './voting-screen.component.scss'
})

export class VotingScreenComponent implements OnInit {
  ballot: { electionId: number, title: string, positions: PositionBallot[] } | null = null;
  selections: { [positionId: number]: number[] } = {};
  showConfirm = false;
  submitting = false;
  successMessage = '';
  hasVoted = false;
  electionTitle:string="";

  // optional: fill from JWT
  voterName: string | null = null;
  voterBatch: string | null = null;
  voted: boolean = false;
  errorMessage: string | undefined;

  constructor(private http: HttpClient,private voteService:VoteService) { }

  ngOnInit() {
    this.loadVoterFromJwt();
    this.loadBallot(1);
  }

  loadVoterFromJwt() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.voterName = payload?.name || payload?.unique_name || null;
      this.voterBatch = payload?.Batch || null;
      // optional: flag if already voted (can be from server)
      // this.hasVoted = payload?.hasVoted === true;
    } catch (e) { /* ignore decode errors */ }
  }

 loadBallot(electionId: number): void {
    this.voteService.getBallot(electionId).subscribe({
      next: (data) => {
        this.ballot = data;
       
        // initialize empty selections
        for (const p of this.ballot.positions) {
          this.selections[p.id] = [];
        }

        // if you want to check "already voted" from API, you can set it here
        this.voted = false; // or derive from API if available
      },
      error: (err) => {
        this.errorMessage = 'Failed to load ballot';
        console.error(err);
      }
    });
  }



  checkVoterStatus(electionId: string) {
    // optional endpoint to see if voter already voted
    this.http.get<any>(`/api/election/${electionId}/status`).subscribe({
      next: s => {
        this.hasVoted = s?.hasVoted === true;
      }, error: _ => { }
    });
  }

  isSelected(posId: number, candidateId: number) {
    return this.selections[posId] && this.selections[posId].indexOf(candidateId) !== -1;
  }

  selectedCount(posId: number) {
    return (this.selections[posId] || []).length;
  }

  toggleSelection(pos: PositionBallot, candidate: CandidateBallot, checked: boolean) {
    if (this.hasVoted) return;
    const arr = this.selections[pos.id] || [];
    if (pos.maxSelect == 1) {
      // single choice: set only this
      this.selections[pos.id] = checked ? [candidate.id] : [];
      return;
    }
    // multi choice
    if (checked) {
      if (arr.length >= pos.maxSelect) {
        // can't select more
        alert(`You can select up to ${pos.maxSelect} candidates for ${pos.name}.`);
        return;
      }
      arr.push(candidate.id);
    } else {
      const idx = arr.indexOf(candidate.id);
      if (idx >= 0) arr.splice(idx, 1);
    }
    this.selections[pos.id] = arr;
  }

  clearPosition(pos: PositionBallot) {
    if (this.hasVoted) return;
    this.selections[pos.id] = [];
  }

  hasSelections() {
    return Object.values(this.selections).some(a => a && a.length > 0);
  }

  candidateName(pos: PositionBallot, id: number) {
    const c = pos.candidates.find(x => x.id === id);
    return c ? c.name : id;
  }

  confirmSubmit() {
    // basic validation: enforce minSelect where required
    for (const pos of this.ballot!.positions) {
      const count = (this.selections[pos.id] || []).length;
      // if (pos.minSelect && count < pos.minSelect) {
      //   if (!confirm(`You have not selected the required number of candidates for "${pos.title}". Continue anyway?`)) {
      //     return;
      //   }
      // }
    }
    this.showConfirm = true;
  }
  getSelectedNamesForPosition(pos: any): string {
    const selected = this.selections[pos.id] as number[];
    if (!selected || selected.length === 0) return 'None';

    return selected
      .map((id: number) => this.candidateName(pos, id))
      .join(', ');
  }


  submitVote() {
    if (!this.ballot) return;
    this.submitting = true;
    
    const payload = {
      electionId: this.ballot.electionId,
      selections: Object.keys(this.selections).map(pid => ({
        positionId: Number(pid),
        candidateIds: this.selections[Number(pid)]
      })),
    };
   this.voteService.submitVote( payload)
    .pipe(finalize(() => { this.submitting = false; }))
    .subscribe({
      next: res => {
        this.successMessage = res?.message || 'Vote submitted';
        this.hasVoted = true;
        this.showConfirm = false;
      },
      error: err => {
        console.error('submit failed', err);
        alert(err?.error?.message || 'Failed to submit vote. Try again.');

      }
    });

  }
}
