import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { CandidateBallot, PositionBallot, VoteService } from '../../Services/vote.service';
import { Position } from '../../Services/position.service';
import { Candidate } from '../../Services/candidate.service';
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from '@angular/material/progress-bar';
import confetti from 'canvas-confetti';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from '../../Services/snackbar.service';

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
  imports: [CommonModule, MatIconModule, MatProgressBarModule],
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
  electionTitle: string = "";

  // optional: fill from JWT
  voterName: string | null = null;
  voterBatch: string | null = null;
  voted: boolean = false;
  errorMessage: string | undefined;

  constructor(private http: HttpClient, private voteService: VoteService, private snackBar: SnackbarService) { }

  ngOnInit() {
    // this.launchOlympicStyleFireworks();
    // this.loadVoterFromJwt();
    this.loadBallot();
    this.checkVoterStatus();
  }
  launchOlympicStyleFireworks() {
    const duration = 3000;
    const end = Date.now() + duration;

    // Big opening burst with cheer
    confetti({
      particleCount: 250,
      spread: 120,
      origin: { y: 0.7 },
      startVelocity: 60,
      colors: ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffbe0b']
    });
    this.playSound('cheer.mp3');

    (function frame(self) {
      // Side arcs with pop sounds
      confetti({
        particleCount: 12,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        startVelocity: 40,
        colors: ['#ffffff', '#ffcc00', '#00bfff']
      });
      //self.playSound('pop.mp3');

      confetti({
        particleCount: 12,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        startVelocity: 40,
        colors: ['#ffffff', '#ffcc00', '#00bfff']
      });
      //self.playSound('pop.mp3');

      // Sparkle rain (no sound, keep subtle)
      confetti({
        particleCount: 5,
        spread: 360,
        startVelocity: 30,
        origin: { y: 0.9 },
        colors: ['#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(() => frame(self));
      }
    }(this));
  }
  playSound(file: string) {
    const audio = new Audio(`sounds/${file}`);
    audio.volume = 0.3; // subtle volume
    audio.play();
  }



  // loadVoterFromJwt() {
  //   try {
  //     const token = localStorage.getItem('authToken');
  //     if (!token) return;

  //     const payload = JSON.parse(atob(token.split('.')[1]));
  //     console.log(payload)
  //     this.voterName = payload?.name || payload?.unique_name || null;
  //     this.voterBatch = payload?.Batch || null;
  //     // optional: flag if already voted (can be from server)
  //     // this.hasVoted = payload?.hasVoted === true;
  //   } catch (e) { /* ignore decode errors */ }
  // }

  loadBallot(): void {
    this.voteService.getBallot().subscribe({
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


  checkVoterStatus() {

    this.voteService.checkVoterStatus().subscribe({
      next: (s) => {
        this.hasVoted = s?.hasVoted === true;
      },
      error: (err) => {
        console.error(err);
      }
    });

  }



  isSelected(posId: number, candidateId: number) {
    return this.selections[posId] && this.selections[posId].indexOf(candidateId) !== -1;
  }

  selectedCount(posId: number) {
    return (this.selections[posId] || []).length;
  }

  toggleSelection(pos: PositionBallot, candidate: CandidateBallot, checked: boolean, event: Event) {
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
        this.snackBar.showError(
          `You can select up to ${pos.maxSelect} candidates for ${pos.name}.`
        );

        // revert the checkbox immediately
        (event.target as HTMLInputElement).checked = false;

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
    this.voteService.submitVote(payload)
      .pipe(finalize(() => { this.submitting = false; }))
      .subscribe({
        next: res => {
          this.successMessage = res?.message || 'Vote submitted';
          this.hasVoted = true;
          this.showConfirm = false;
        },
        error: err => {
          console.error('submit failed', err);
          this.snackBar.showError(err?.error?.message || 'Failed to submit vote. Try again.');

        }
      });

  }
}
