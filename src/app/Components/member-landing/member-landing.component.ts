import { Component, HostListener, OnInit } from '@angular/core';
import { Member, MemberService, MemberFilterDto, BatchSummary } from '../../Services/member.service';
import { CommonModule } from '@angular/common';
import { MemberFeeAmountPipe } from '../../Pipes/member-fee-amount.pipe';
import { FormsModule } from '@angular/forms';
import { MemberDetailsComponent } from '../member-details/member-details.component';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import { AuthService } from '../../Services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from "@angular/material/tabs";
import { MatProgressBarModule } from "@angular/material/progress-bar";


@Component({

  selector: 'app-member-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MemberFeeAmountPipe,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    MatProgressBarModule
  ],
  templateUrl: './member-landing.component.html',
  styleUrls: ['./member-landing.component.scss'],

})
export class MemberLandingComponent implements OnInit {
  members: Member[] = [];
  totalItems = 0;
  totalPages = 0;
  pageNumber = 1;
  pageSize = 10;
  totalMembershipAmount = 0;
  totalDonationAmount = 0;
  totalAmount = 0;
  // For filters
  filter: MemberFilterDto = { pageNumber: 1, pageSize: 10, gender: null, bloodGroup: "" };
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  // ✅ Loader state
  loading: boolean = false;
  isMobile = false;
  batch: number | null | undefined;
  batchSummaries: BatchSummary[] = [];
  currentYear = new Date().getFullYear();

  constructor(private memberService: MemberService, private dialog: MatDialog,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    this.setPageSize();
    this.initFilter();
    this.loadMembers();
    // Get batch from JWT
    this.batch = this.authService.getBatch();

    this.loadBatchSummary(); // ✅ Add this here to load data on startup

  }
  initFilter() {
    this.filter.pageNumber = 1;

  }
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768; // You can adjust the breakpoint
  }
  loadMembers() {

    this.loading = true; // Show loader

    this.memberService.filterMembers(this.filter).subscribe({
      next: (res) => {
        this.members = res.members;

        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
        this.pageNumber = res.pageNumber;
        this.totalMembershipAmount = res.totalMembershipAmount;
        this.totalDonationAmount = res.totalDonationAmount;
        this.totalAmount = res.totalAmount;
        this.loading = false; // Hide loader
      },
      error: () => {
        this.loading = false; // Hide loader even on error
      }
    });
  }

  loadBatchSummary(): void {
    this.memberService.getBatchSummary().subscribe({
      next: (res) => {
        this.batchSummaries = res;
      },
      error: () => {
        console.error('Failed to load batch summary.');
      }
    });
  }

  isRepresentative(): boolean {
    return this.authService.hasRole('Representative');
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole('SuperAdmin');
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setPageSize();
  }

  setPageSize() {
    if (typeof window !== 'undefined') {
      this.pageSize = window.innerWidth < 768 ? 5 : 20;
    }
  }
  onPageChange(page: number) {
    this.filter.pageNumber = page;
    this.loadMembers();
  }
  applyFilter() {
    this.loadMembers(); // Reset to first page whenever filter changes
  }
  // ✅ Add this method
  resetFilters() {
    this.filter = { pageNumber: 1, pageSize: this.pageSize, gender: null, bloodGroup: "" };
    this.loadMembers();
  }
  viewMemberDetails(member: any) {
    this.dialog.open(MemberDetailsComponent, {
      data: member,
      width: '500px'
    });
  }
  getMiddlePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(2, this.pageNumber - 1);
    const end = Math.min(this.totalPages - 1, this.pageNumber + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
  sendActiveReq(memberId: number) {
    const confirmed = confirm('Proceed with this action?');

    if (!confirmed) return;
    this.memberService.requestActivation(memberId).subscribe({
      next: (res) => {
        console.log(res);
        this.loadMembers();

      },
      error: (err) => {
        console.log("Error:", JSON.stringify(err.error, null, 2));



      }
    });
  }
  approveRequest(memberId: number) {
    const confirmed = confirm('Proceed with this action?');
    if (!confirmed) return;
    this.memberService.approveRequest(memberId).subscribe({
      next: (res) => {
        this.loadMembers();

      },
      error: () => {

      }
    });
  }


  activeDirectly(memberId: number) {
    const confirmed = confirm('Proceed with this action?');
    if (!confirmed) return;
    this.memberService.activateMemberDirectly(memberId).subscribe({
      next: (res) => {
        this.loadMembers();

      },
      error: () => {

      }
    });
  }

  makeUserOfAllCtiveMember() {

    this.authService.createUsersForActiveMembers().subscribe({
      next: (res) => {

      },
      error: () => {

      }
    });
  }
}
