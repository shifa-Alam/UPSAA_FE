import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CandidateResult, PositionResult, VoteService, ElectionResult } from '../../Services/vote.service';

interface Candidate {
  memberName: string;
  positionName: string;
  votes: number;
}

interface Position {
  positionName: string;
  topCandidate: Candidate;
}
@Component({
  selector: 'app-vote-casts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vote-casts.component.html',
  styleUrl: './vote-casts.component.scss'
})
export class VoteCastsComponent implements OnInit {
  activeTab: 'overview' | 'details' = 'overview';
  totalCandidate: number =0;
  totalVoter: number =0;
  totalPosition: number=0;
  electionTitle: string='';
  loading: boolean=false;

  setTab(tab: 'overview' | 'details') {
    this.activeTab = tab;
  }
  electionDate: string = '';
  totalVotes: number = 0;
  leadingCandidate?: CandidateResult;
  candidates: CandidateResult[] = [];
  positions: PositionResult[] = [];

  constructor(private voteService: VoteService) { }

  ngOnInit(): void {
    this.getElectionResults();
  }

getElectionResults(): void {
  this.loading = true; // Show loading spinner

  const electionId = 1; // Replace with dynamic ID if needed

  this.voteService.getElectionResults(electionId).subscribe({
    next: (res: ElectionResult) => {
      if (!res) {
        this.loading = false;
        console.warn('Election results not found.');
        return;
      }

      // Set main data
      this.electionTitle = res.electionTitle;
      this.totalCandidate = res.totalCandidate ||0;
      this.totalVoter = res.totalVoter||0;
      this.totalVotes = res.totalVotes;
      this.candidates = res.candidates || [];
      this.positions = res.positions || [];
      this.totalPosition = res.totalPosition || this.positions.length;

      // Format date as "5 March, 2026"
      this.electionDate = res.electionDate
        ? new Date(res.electionDate).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : '';

      // Build additional summary if needed
      this.buildPositionSummary();

      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to fetch election results', err);
      this.loading = false;
    }
  });
}

  private buildPositionSummary(): void {
    if (this.positions && this.positions.length) return; // Already populated by API

  }
}