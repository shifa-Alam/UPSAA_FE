import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

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

  electionDate: string = 'February 23, 2026';

  // Example dataset (replace with API data)
  candidates = [
    // President (1 seat)
    { memberName: 'Alice Rahman', positionName: 'President', votes: 120 },
    { memberName: 'Karim Hossain', positionName: 'President', votes: 95 },
    { memberName: 'Farzana Sultana', positionName: 'President', votes: 88 },

    // Secretary (2 seats)
    { memberName: 'Nadia Akter', positionName: 'Secretary', votes: 80 },
    { memberName: 'Rafiq Islam', positionName: 'Secretary', votes: 60 },
    { memberName: 'Imran Kabir', positionName: 'Secretary', votes: 72 },
    { memberName: 'Sadia Noor', positionName: 'Secretary', votes: 65 },

    // Treasurer (1 seat)
    { memberName: 'Shirin Alam', positionName: 'Treasurer', votes: 70 },
    { memberName: 'Tanvir Chowdhury', positionName: 'Treasurer', votes: 50 },

    // Vice President (2 seats)
    { memberName: 'Mahmud Hasan', positionName: 'Vice President', votes: 110 },
    { memberName: 'Rumana Yasmin', positionName: 'Vice President', votes: 92 },
    { memberName: 'Iqbal Hossain', positionName: 'Vice President', votes: 85 },

    // Joint Secretary (2 seats)
    { memberName: 'Sajid Rahman', positionName: 'Joint Secretary', votes: 77 },
    { memberName: 'Maliha Akter', positionName: 'Joint Secretary', votes: 74 },
    { memberName: 'Rakibul Islam', positionName: 'Joint Secretary', votes: 69 },

    // Cultural Secretary (2 seats)
    { memberName: 'Rashedul Karim', positionName: 'Cultural Secretary', votes: 85 },
    { memberName: 'Mitu Chowdhury', positionName: 'Cultural Secretary', votes: 70 },
    { memberName: 'Nadia Sultana', positionName: 'Cultural Secretary', votes: 65 },

    // Sports Secretary (2 seats)
    { memberName: 'Arif Hossain', positionName: 'Sports Secretary', votes: 95 },
    { memberName: 'Samira Khan', positionName: 'Sports Secretary', votes: 80 },
    { memberName: 'Shuvo Alam', positionName: 'Sports Secretary', votes: 76 },

    // IT Secretary (2 seats)
    { memberName: 'Shahriar Rahman', positionName: 'IT Secretary', votes: 100 },
    { memberName: 'Tania Akter', positionName: 'IT Secretary', votes: 85 },
    { memberName: 'Anisur Rahman', positionName: 'IT Secretary', votes: 78 },

    // Education Secretary (3 seats)
    { memberName: 'Jamil Ahmed', positionName: 'Education Secretary', votes: 88 },
    { memberName: 'Rumana Yasmin', positionName: 'Education Secretary', votes: 76 },
    { memberName: 'Sadia Hasan', positionName: 'Education Secretary', votes: 74 },
    { memberName: 'Kamal Uddin', positionName: 'Education Secretary', votes: 70 },

    // Welfare Secretary (2 seats)
    { memberName: 'Hasan Mahmud', positionName: 'Welfare Secretary', votes: 92 },
    { memberName: 'Sultana Begum', positionName: 'Welfare Secretary', votes: 81 },
    { memberName: 'Farhana Rahman', positionName: 'Welfare Secretary', votes: 75 },

    // Publication Secretary (2 seats)
    { memberName: 'Shabnam Jahan', positionName: 'Publication Secretary', votes: 66 },
    { memberName: 'Rafiq Chowdhury', positionName: 'Publication Secretary', votes: 72 },
    { memberName: 'Nusrat Jahan', positionName: 'Publication Secretary', votes: 68 },

    // Finance Secretary (2 seats)
    { memberName: 'Tanvir Hasan', positionName: 'Finance Secretary', votes: 105 },
    { memberName: 'Mim Akter', positionName: 'Finance Secretary', votes: 95 },
    { memberName: 'Sadia Karim', positionName: 'Finance Secretary', votes: 89 },

    // Event Coordinator (3 seats)
    { memberName: 'Shuvo Alam', positionName: 'Event Coordinator', votes: 96 },
    { memberName: 'Mim Akter', positionName: 'Event Coordinator', votes: 84 },
    { memberName: 'Sadia Hasan', positionName: 'Event Coordinator', votes: 75 },
    { memberName: 'Rafiq Islam', positionName: 'Event Coordinator', votes: 70 }
  ];

  // Define how many winners each position should have
  positionSeats: { [key: string]: number } = {
    'President': 1,
    'Secretary': 2,
    'Treasurer': 1,
    'Vice President': 2,
    'Joint Secretary': 2,
    'Cultural Secretary': 2,
    'Sports Secretary': 2,
    'IT Secretary': 2,
    'Education Secretary': 3,
    'Welfare Secretary': 2,
    'Publication Secretary': 2,
    'Finance Secretary': 2,
    'Event Coordinator': 3
  };

  positions: any[] = [];
  totalVotes: number = 0;
  leadingCandidate: any;

  ngOnInit(): void {
    this.calculateTotals();
    this.findLeadingCandidate();
    this.buildPositionSummary();
  }

  calculateTotals(): void {
    this.totalVotes = this.candidates.reduce((sum, c) => sum + c.votes, 0);
  }

  findLeadingCandidate(): void {
    this.leadingCandidate = this.candidates.reduce((prev, curr) =>
      prev.votes > curr.votes ? prev : curr
    );
  }

  buildPositionSummary(): void {
    const grouped: { [key: string]: any[] } = {};

    this.candidates.forEach(c => {
      if (!grouped[c.positionName]) {
        grouped[c.positionName] = [];
      }
      grouped[c.positionName].push(c);
    });

    this.positions = Object.keys(grouped).map(posName => {
      const posCandidates = grouped[posName];
      const totalPosVotes = posCandidates.reduce((sum, c) => sum + c.votes, 0);

      // Sort candidates by votes descending
      const sorted = posCandidates.sort((a, b) => b.votes - a.votes);

      // Pick top N winners based on positionSeats
      const seats = this.positionSeats[posName] || 1;
      const winners = sorted.slice(0, seats);

      return {
        positionName: posName,
        totalVotes: totalPosVotes,
        winners: winners
      };
    });
  }
}
