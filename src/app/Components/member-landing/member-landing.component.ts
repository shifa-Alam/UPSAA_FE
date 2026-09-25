import { Component, HostListener, OnInit, inject } from '@angular/core';
import { ConfirmService } from '../../Services/confirm.service';
import { Member, MemberService, MemberFilterDto, BatchSummary } from '../../Services/member.service';
import { CommonModule } from '@angular/common';
import { MemberFeeAmountPipe } from '../../Pipes/member-fee-amount.pipe';
import { FormsModule } from '@angular/forms';
import { MemberDetailsComponent } from '../member-details/member-details.component';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../Services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from "@angular/material/tabs";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';


import { CountUpDirective } from '../shared/count-up/count-up.directive';
@Component({

  selector: 'app-member-landing',
  standalone: true,
  imports: [CountUpDirective, 
    CommonModule,
    FormsModule,
    MemberFeeAmountPipe,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    MatProgressBarModule,
    AdminHeaderComponent,
    SectionCardComponent,
    TranslatePipe
  ],
  templateUrl: './member-landing.component.html',
  styleUrls: ['./member-landing.component.scss'],

})
export class MemberLandingComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  members: Member[] = [];
  totalItems = 0;
  totalPages = 0;
  pageNumber = 1;
  pageSize = 10;
  totalMembershipAmount = 0;
  totalDonationAmount = 0;
  totalAmount = 0;
  // For filters
  filter: MemberFilterDto = { pageNumber: 1, pageSize: 10, gender: null, bloodGroup: "",active:null };
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  // ✅ Loader state
  loading: boolean = false;
  isMobile = false;
  batch: number | null | undefined;
  batchSummaries: BatchSummary[] = [];
  currentYear = new Date().getFullYear();

  constructor(private memberService: MemberService, private dialog: MatDialog,
    public authService: AuthService, private languageService: LanguageService
  ) { }

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    this.setPageSize();
    this.initFilter();
    this.loadMembers();
    // Get batch from JWT
    this.batch = this.authService.getBatch();

   // this.loadBatchSummary(); // ✅ Add this here to load data on startup

  }
  initFilter() {
    this.filter.pageNumber = 1;

  }
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768; // You can adjust the breakpoint
  }


onTabChange(event: any) {
  // Compare by tab index rather than the (now translatable) text label, so this
  // keeps working regardless of the active language. Index 1 is the Batch Summary tab.
  if (event.index === 1) {
    this.loadBatchSummary();
  }
}

  // Maps a raw status badge value coming from the backend to its translated display label,
  // without altering the underlying data (falls back to the raw value if unrecognized).
  getStatusBadgeLabel(statusBadge: any): string {
    const map: { [key: string]: string } = {
      'Fully Paid': this.languageService.translate('memberLanding.statusFullyPaid'),
      'Partially Paid': this.languageService.translate('memberLanding.statusPartiallyPaid'),
      'Not Paid': this.languageService.translate('memberLanding.statusNotPaid'),
      'Unpaid': this.languageService.translate('memberLanding.statusNotPaid'),
      'Pending': this.languageService.translate('memberLanding.statusPending'),
      'In Progress': this.languageService.translate('memberLanding.statusInProgress')
    };
    return map[statusBadge] ?? statusBadge;
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
    this.loading = true; // Show loader
    this.memberService.getBatchSummary().subscribe({
      next: (res) => {
        this.batchSummaries = res;
        this.loading = false; // Show loader
      },
      error: () => {
        console.error('Failed to load batch summary.');
        this.loading = false; // Show loader
      }
    });
  }

  // Totals across the loaded batch summary rows, for the summary stat cards.
  get batchTotals(): { registered: number; amount: number; fullyPaid: number } {
    return this.batchSummaries.reduce(
      (acc, b) => ({
        registered: acc.registered + (Number(b.registeredMembers) || 0),
        amount: acc.amount + (Number(b.totalAmount) || 0),
        fullyPaid: acc.fullyPaid + (Number(b.percentagePaid) >= 100 ? 1 : 0)
      }),
      { registered: 0, amount: 0, fullyPaid: 0 }
    );
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
      width: '520px'
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
  private confirmContinue(action: () => void): void {
    this.confirmService.ask({ message: this.languageService.translate('memberLanding.confirmContinue') }).subscribe(ok => {
      if (ok) action();
    });
  }

  sendActiveReq(memberId: number) {
    this.confirmContinue(() => {
      this.memberService.requestActivation(memberId).subscribe({
        next: (res) => {
          console.log(res);
          this.loadMembers();
        },
        error: (err) => {
          console.log("Error:", JSON.stringify(err.error, null, 2));
        }
      });
    });
  }

  approveRequest(memberId: number) {
    this.confirmContinue(() => {
      this.memberService.approveRequest(memberId).subscribe({
        next: () => this.loadMembers(),
        error: () => { }
      });
    });
  }

  activeDirectly(memberId: number) {
    this.confirmContinue(() => {
      this.memberService.activateMemberDirectly(memberId).subscribe({
        next: () => this.loadMembers(),
        error: () => { }
      });
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
