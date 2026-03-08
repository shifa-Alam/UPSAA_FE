import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CandidateResult, PositionResult, VoteService, ElectionResult } from '../../Services/vote.service';
import { PositionService } from '../../Services/position.service';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule,],
  templateUrl: './vote-casts.component.html',
  styleUrl: './vote-casts.component.scss'
})
export class VoteCastsComponent implements OnInit {
  activeTab: 'overview' | 'details' = 'overview';
  totalCandidate: number = 0;
  totalVoter: number = 0;
  totalPosition: number = 0;
  electionTitle: string = '';
  loading: boolean = false;
  candidateResults: CandidateResult[] = [];
  detailsLoading: boolean=false;

  setTab(tab: 'overview' | 'details') {
    this.activeTab = tab;
    if (tab === 'details') {
      this.positionId=0;
      this.loadPositions();
      this.filterElectionResults();
    }

  }


  electionDate: string = '';
  totalVotes: number = 0;
  leadingCandidate?: CandidateResult;
  candidates: CandidateResult[] = [];
  positionResults: PositionResult[] = [];
  positions: any[] = [];
  positionId: number = 0;
  constructor(private voteService: VoteService, private positionService: PositionService) { }

  ngOnInit(): void {
    this.getElectionResults();
  }
  onSelectFocus(event: FocusEvent) {
    const target = event.target as HTMLSelectElement;
    target.style.borderColor = '#3b82f6';
    target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
  }

  onSelectBlur(event: FocusEvent) {
    const target = event.target as HTMLSelectElement;
    target.style.borderColor = '#cbd5e1';
    target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  }

  onSelectMouseOver(event: MouseEvent) {
    const target = event.target as HTMLSelectElement;
    target.style.backgroundColor = '#ffffff';
  }

  onSelectMouseOut(event: MouseEvent) {
    const target = event.target as HTMLSelectElement;
    target.style.backgroundColor = '#f8fafc';
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
        this.totalCandidate = res.totalCandidate || 0;
        this.totalVoter = res.totalVoter || 0;
        this.totalVotes = res.totalVotes;
        this.candidates = res.candidates || [];
        this.positionResults = res.positions || [];
        this.totalPosition = res.totalPosition || this.positionResults.length;

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

  loadPositions() {
    
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


  filterElectionResults(): void {
    this.candidateResults=[];
    this.detailsLoading = true; // Show loading spinner

    const electionId = 1; // Replace with dynamic election ID

    this.voteService.filterElectionResults(electionId, this.positionId).subscribe({
      next: (res: CandidateResult[]) => {
        this.detailsLoading = false;

        // Save results to component property
        this.candidateResults = res;

        // Optional: sort by votes descending
       // this.candidateResults.sort((a, b) => b.votes - a.votes);

        // Optional: calculate total votes and percentage
        const totalVotes = this.candidateResults.reduce((sum, c) => sum + c.votes, 0);
        this.candidateResults = this.candidateResults.map(c => ({
          ...c,
          percentage: totalVotes > 0 ? +(c.votes * 100 / totalVotes).toFixed(2) : 0
        }));
      },
      error: (err) => {
        console.error('Failed to fetch election results', err);
        this.detailsLoading = false;
        this.candidateResults=[];
      }
    });
  }
  private buildPositionSummary(): void {
    if (this.positionResults && this.positionResults.length) return; // Already populated by API

  }
}