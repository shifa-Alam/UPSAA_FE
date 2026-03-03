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
    const electionId = 1; // Replace with actual election ID if needed

    this.voteService.getElectionResults(electionId).subscribe((res: ElectionResult) => {
      this.totalVotes = res.totalVotes;
      this.candidates = res.candidates;
      this.leadingCandidate = res.leadingCandidate;
      this.positions = res.positions;
      this.electionDate = new Date(res.electionDate).toLocaleDateString();

      // Optionally, calculate positions summary if backend doesn't send winners
      this.buildPositionSummary();
    });
  }

  private buildPositionSummary(): void {
    if (this.positions && this.positions.length) return; // Already populated by API

  }
}