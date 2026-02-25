import { AfterViewInit, Component } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import html2canvas from 'html2canvas';
import { ElementRef, ViewChild } from '@angular/core';
@Component({
  selector: 'app-vote-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './vote-card.component.html',
  styleUrls: ['./vote-card.component.scss']
})
export class VoteCardComponent implements AfterViewInit {
  @ViewChild('voterCard') voterCard!: ElementRef<HTMLDivElement>;
  // Dynamic voter data
  voterName!: string;
  voterBatch!: string | number;
  memberCode!: string | number;
  voteDate!: string;
  resultDate!: string;

  constructor(private router: Router) {
    const navState = this.router.getCurrentNavigation()?.extras.state;
    if (navState) {
      this.voterName = navState['name'];
      this.voterBatch = navState['batch'];
      this.memberCode = navState['memberCode'];
      this.voteDate = navState['voteDate'];
      this.resultDate = navState['resultDate'];
    }
  }
  ngAfterViewInit() {
    // Automatically trigger download after the view has rendered
    this.downloadCard();
  }

  downloadCard() {
    if (!this.voterCard) return;

    html2canvas(this.voterCard.nativeElement, { scale: 4 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${this.voterName}_voterCard.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
    });
  }
}