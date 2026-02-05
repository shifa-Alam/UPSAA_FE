import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
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
  totalVotes: number = 0;
  candidates: Candidate[] = [];
  positions: Position[] = [];
  leadingCandidate?: Candidate = { memberName: '-', positionName: '-', votes: 0 };;

  constructor() { }

  ngOnInit(): void {
    // Dummy data
    this.candidates = [
      { memberName: 'John Doe', positionName: 'President', votes: 350 },
      { memberName: 'Jane Smith', positionName: 'Vice President', votes: 290 },
      { memberName: 'Mike Johnson', positionName: 'Secretary', votes: 180 },
      { memberName: 'Lisa Brown', positionName: 'President', votes: 120 },
      { memberName: 'Kevin White', positionName: 'Vice President', votes: 110 }
    ];

    this.totalVotes = this.candidates.reduce((sum, c) => sum + c.votes, 0);

    // Positions
    const positionNames = Array.from(new Set(this.candidates.map(c => c.positionName)));
    this.positions = positionNames.map(pos => {
      const topCandidate = this.candidates
        .filter(c => c.positionName === pos)
        .reduce((prev, curr) => (curr.votes > prev.votes ? curr : prev));
      return { positionName: pos, topCandidate };
    });

    // Leading candidate overall
    this.leadingCandidate = this.candidates.reduce((prev, curr) => (curr.votes > prev.votes ? curr : prev));

    // Render chart after small delay to ensure view is ready
    setTimeout(() => this.renderChart(), 0);
  }

  renderChart() {
    const Chart = require('chart.js/auto');
    const ctx = (document.getElementById('voteChart') as HTMLCanvasElement).getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.candidates.map(c => c.memberName),
        datasets: [{
          label: 'Votes',
          data: this.candidates.map(c => c.votes),
          backgroundColor: ['#2563eb', '#1d4ed8', '#facc15', '#f97316', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}
