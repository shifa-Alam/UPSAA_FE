import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { VoteService, CommitteePosition } from '../../../Services/vote.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

interface TreeNode {
  memberName: string;
  photo: string | null;
  positionName: string;
  batch?: number;
}

@Component({
  selector: 'app-committee',
  standalone: true,
  imports: [CommonModule, MatIconModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './committee.component.html',
  styleUrl: './committee.component.scss'
})
export class CommitteeComponent implements OnInit {
  loading = true;
  loadError = false;
  electionTitle = '';
  /** Priority-ordered positions, bucketed into visual tiers (root → leadership → secretaries → members) for the org tree. */
  tiers: TreeNode[][] = [];

  constructor(private voteService: VoteService) { }

  ngOnInit(): void {
    this.voteService.getPublicCommittee().pipe(
      catchError(() => of(null))
    ).subscribe(committee => {
      this.loading = false;

      if (!committee || !committee.positions || !committee.positions.length) {
        this.loadError = true;
        return;
      }

      this.electionTitle = committee.electionTitle;
      this.tiers = this.buildTiers(committee.positions);
    });
  }

  private buildTiers(positions: CommitteePosition[]): TreeNode[][] {
    const flatten = (group: CommitteePosition[]): TreeNode[] =>
      group.flatMap(pos => pos.members.map(m => ({
        memberName: m.memberName,
        photo: m.photo,
        batch: m.batch,
        positionName: pos.positionName,
      })));

    // Too few positions to meaningfully split into tiers — one row each.
    if (positions.length <= 3) {
      return positions.map(pos => flatten([pos]));
    }

    // President (priority 1) is the root; next two positions form the senior-leadership
    // row; everything up to the last position fills the wide secretaries row; the final
    // (lowest-priority) position — typically Executive Members — forms the base row.
    return [
      flatten(positions.slice(0, 1)),
      flatten(positions.slice(1, 3)),
      flatten(positions.slice(3, positions.length - 1)),
      flatten(positions.slice(positions.length - 1)),
    ].filter(tier => tier.length > 0);
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
