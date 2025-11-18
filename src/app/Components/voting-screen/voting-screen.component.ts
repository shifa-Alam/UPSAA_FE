import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
type Candidate = {
  id: string;   // <-- force string
  name: string;
  batch: number;
  photoUrl?: string;
  bio?: string;
  extra?: string;
};

type Position = {
  id: string;  // <-- force string
  title: string;
  maxSelect: number; // 1 for single-choice, >1 for multi
  candidates: Candidate[];
};

@Component({
  selector: 'app-voting-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voting-screen.component.html',
  styleUrl: './voting-screen.component.scss'
})

export class VotingScreenComponent implements OnInit {
  ballot: { electionId: string, title: string, positions: Position[] } | null = null;
  selections: { [positionId: string]: string[] } = {};
  showConfirm = false;
  submitting = false;
  successMessage = '';
  hasVoted = false;

  // optional: fill from JWT
  voterName: string | null = null;
  voterBatch: string | null = null;
  voted: boolean = false;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadVoterFromJwt();
    this.loadBallot();
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

  loadBallot() {
    // Dummy ballot data
    this.ballot = {
      electionId: 'election-2025',
      title: 'UPSAA Election 2026',
      positions: [
        {
          id: '1', // string
          title: 'President',
          maxSelect: 1,
          candidates: [
            { id: '101', name: 'Shifat Hasan', batch: 2008 },
            { id: '102', name: 'Rony Ahmed', batch: 2009 },
            { id: '103', name: 'Rahad Ahmed', batch: 2003 },
            { id: '104', name: 'Mahmuda Binta Muhammad Monni ', batch: 2012 }
          ]
        },
        {
          id: '2',
          title: 'Vice President',
          maxSelect: 1,
          candidates: [
            { id: '201', name: 'Afsana Mimi', batch: 2010 },
            { id: '202', name: 'Nadim Shohag', batch: 2009 }
          ]
        },
        {
          id: '3',
          title: 'Executive Member',
          maxSelect: 5,
          candidates: [
            { id: '301', name: 'Tanzim Khan', batch: 2011 },
            { id: '302', name: 'Shakil Hossain', batch: 2010 },
            { id: '303', name: 'Juthi Akter', batch: 2012 }
          ]
        }
      ]
    };


    // initialize empty selections
    for (const p of this.ballot.positions) {
      this.selections[p.id] = [];
    }

    // no API voter status check, you can simulate too
    this.voted = false; // or true to test "already voted"
  }


  checkVoterStatus(electionId: string) {
    // optional endpoint to see if voter already voted
    this.http.get<any>(`/api/election/${electionId}/status`).subscribe({
      next: s => {
        this.hasVoted = s?.hasVoted === true;
      }, error: _ => { }
    });
  }

  isSelected(posId: string, candidateId: string) {
    return this.selections[posId] && this.selections[posId].indexOf(candidateId) !== -1;
  }

  selectedCount(posId: string) {
    return (this.selections[posId] || []).length;
  }

  toggleSelection(pos: Position, candidate: Candidate, checked: boolean) {
    if (this.hasVoted) return;
    const arr = this.selections[pos.id] || [];
    if (pos.maxSelect === 1) {
      // single choice: set only this
      this.selections[pos.id] = checked ? [candidate.id] : [];
      return;
    }
    // multi choice
    if (checked) {
      if (arr.length >= pos.maxSelect) {
        // can't select more
        alert(`You can select up to ${pos.maxSelect} candidates for ${pos.title}.`);
        return;
      }
      arr.push(candidate.id);
    } else {
      const idx = arr.indexOf(candidate.id);
      if (idx >= 0) arr.splice(idx, 1);
    }
    this.selections[pos.id] = arr;
  }

  clearPosition(pos: Position) {
    if (this.hasVoted) return;
    this.selections[pos.id] = [];
  }

  hasSelections() {
    return Object.values(this.selections).some(a => a && a.length > 0);
  }

  candidateName(pos: Position, id: string) {
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
    const selected = this.selections[pos.id] as string[];
    if (!selected || selected.length === 0) return 'None';

    return selected
      .map((id: string) => this.candidateName(pos, id))
      .join(', ');
  }


  submitVote() {
    if (!this.ballot) return;
    this.submitting = true;
    const payload = {
      electionId: this.ballot.electionId,
      selections: Object.keys(this.selections).map(pid => ({
        positionId: pid,
        candidateIds: this.selections[pid]
      })),
      clientTimestamp: new Date().toISOString()
    };
    this.http.post<any>(`/api/election/${this.ballot.electionId}/vote`, payload)
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
