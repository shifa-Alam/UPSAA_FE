import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { VoteService } from '../../../Services/vote.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

interface LeaderSpotlight {
  name: string;
  photo: string | null;
  position: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, SectionCardComponent, StatCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  leaders: LeaderSpotlight[] = [];

  constructor(private voteService: VoteService) { }

  ngOnInit(): void {
    // Public endpoint, no login required — same data source as the Committee page.
    this.voteService.getPublicCommittee().pipe(
      catchError(() => of(null))
    ).subscribe(committee => {
      if (!committee?.positions?.length) return;

      const president = committee.positions[0];
      const secretaryPos = committee.positions.find(p => p.positionName.includes('সাধারণ সম্পাদক'));

      const spotlight: (LeaderSpotlight | null)[] = [
        president?.members?.[0]
          ? { name: president.members[0].memberName, photo: president.members[0].photo, position: president.positionName }
          : null,
        secretaryPos?.members?.[0]
          ? { name: secretaryPos.members[0].memberName, photo: secretaryPos.members[0].photo, position: secretaryPos.positionName }
          : null,
      ];

      this.leaders = spotlight.filter((l): l is LeaderSpotlight => l !== null);
    });
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
