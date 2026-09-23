// src/app/services/member.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface MemberEducationDto {
  degreeId: number;
  degreeName?: string;
  isCompleted: boolean;
  instituteName?: string;
  subject?: string;

}
export enum FeeType {
  Membership = 'Membership',
  Annual = 'Annual',
  Donation = 'Donation'
}

export interface MemberFeeDto {
  feeType: FeeType;    // Membership, Annual, Donation
  amount: number;      // Fixed for Membership & Annual, user-defined for Donation
  isPaid: boolean;     // Whether the fee is selected/paid
}

export interface MemberCreateDto {
  photo?: string;
  fullName: string;
  bloodGroup: string;
  gender: string;
  email: string;
  phone: string;
  batch: number;
  currentDesignation?: string;
  employer?: string;
  currentCity: string;
  dob?: string | null;
  educationRecords: MemberEducationDto[]; // added
  fees: MemberFeeDto[];
  captchaId?: string;
  captchaAnswer?: string;
}

export interface PublicMember {
  id: number;
  fullName: string;
  photo: string | null;
  batch: number;
  currentDesignation?: string | null;
  employer?: string | null;
  currentCity?: string | null;
  bloodGroup?: string | null;
  memberCode?: string | null;
}

export interface PublicMemberFilter {
  pageNumber: number;
  pageSize: number;
  fullName?: string;
  batch?: number;
  currentCity?: string;
  bloodGroup?: string;
}

export interface PaginatedPublicMembersResponse {
  members: PublicMember[];
  totalItems: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface PublicBatch {
  batch: number;
  alumniCount: number;
}

export interface BloodDonor {
  id: number;
  fullName: string;
  batch: number;
  bloodGroup: string | null;
  currentCity: string | null;
  photo: string | null;
  phone: string;
}

export interface CaptchaChallenge {
  captchaId: string;
  image: string; // data:image/png;base64,...
}
export interface MemberFilterDto {
  pageNumber: number;
  pageSize: number;


  batch?: number;
  fullName?: string;
  phoneOrEmail?: string;
  currentCity?: string;
  gender?: string | null;
  bloodGroup?: string;
  degreeId?: number;
  active?:boolean|null
}

export interface Member {
  statusId: any;
  id: number;
  fullName: string;
  memberCode: string;
  isSensitiveHidden: boolean;
  gender: string;
  batch: number;
  currentDesignation: string;
  bloodGroup: string;
  employer: string;
  dob: string;
  photo: string | null;
  email: string;
  phone: string;
  currentCity: string;
  educationRecords: any[];
  fees: any[];
  active: boolean;
  createdDate: string;
  modifiedDate: string | null;

  reqById?: string;
  reqDate?: any;
  approvedOrRejectById?: string;

  approvedOrRejectDate?: any;

}

export interface PaginatedMembersResponse {
  members: Member[];
  totalItems: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  totalMembershipAmount: number;
  totalDonationAmount: number;
  totalAmount: number;
}
// models/member-activation-request.model.ts
export interface MemberActivationRequest {
  memberId: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  reason?: string;
}
export interface BatchSummary {
  pendingMembersCount: any;
  paidMembersCount: any;
  progressColor: string | null | undefined;
  statusBadge: any;
  motivationalMessage: any;
  percentagePaid: any;
  batch: number;
  registeredMembers: number;
  totalAmount: number;
  paidAmount: number;
}


@Injectable({
  providedIn: 'root'
})
export class MemberService {




  private apiUrl = environment.baseUrl + '/member';
  private authApiUrl = environment.baseUrl + '/auth'; // Auth controller
  constructor(private http: HttpClient, private auth: AuthService) { }

  registerMember(member: MemberCreateDto): Observable<any> {
    // Note: concatenate the path as a string
    return this.http.post(`${this.apiUrl}/RegisterMember`, member);
  }
  getCaptcha(): Observable<CaptchaChallenge> {
    return this.http.get<CaptchaChallenge>(`${environment.baseUrl}/Captcha/generate`);
  }
  getMembers(): Observable<MemberCreateDto[]> {
    return this.http.get<MemberCreateDto[]>(`${this.apiUrl}/GetAllMembers`);
    // Adjust the endpoint as per your API route
  }
  /** Public — no login required. Server-side paginated + filtered, payment-free member list. */
  getPublicDirectory(filter: PublicMemberFilter): Observable<PaginatedPublicMembersResponse> {
    return this.http.post<PaginatedPublicMembersResponse>(`${this.apiUrl}/PublicDirectory`, filter);
  }
  /** Public — no login required. Batch year + active alumni count only. */
  getPublicBatchSummary(): Observable<PublicBatch[]> {
    return this.http.get<PublicBatch[]>(`${this.apiUrl}/PublicBatchSummary`);
  }
  /** Alumni-only — requires login (any role). Phone comes back masked ("***") if the donor hid their contact info. */
  getBloodDonors(bloodGroup?: string, city?: string): Observable<BloodDonor[]> {
    const params: string[] = [];
    if (bloodGroup) params.push(`bloodGroup=${encodeURIComponent(bloodGroup)}`);
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<BloodDonor[]>(`${this.apiUrl}/BloodDonors${query}`);
  }
  filterMembers(filter: MemberFilterDto): Observable<PaginatedMembersResponse> {
    console.log(filter)
    return this.http.post<PaginatedMembersResponse>(`${this.apiUrl}/FilterMembers`, filter);
  }
  getBatchSummary(): Observable<BatchSummary[]> {
    return this.http.get<BatchSummary[]>(`${this.apiUrl}/BatchSummary`);
  }
  requestActivation(memberId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/RequestActivation/${memberId}`, {});
  }


  approveRequest(memberId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ApproveActivation/${memberId}`, {});
  }

  rejectRequest(memberId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/RejectActivation/${memberId}`, {});
  }

  activateMemberDirectly(memberId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ActivateDirectly/${memberId}`, {});
  }


  createUserFromMember(memberId: number, role: string = 'Representative'): Observable<any> {
    return this.http.post(`${this.authApiUrl}/CreateUserFromMember/${memberId}?role=${role}`, {});
  }
  // At the bottom of MemberService class

  /** The signed-in member's profile, fetched once and shared by the header, dashboard,
   *  profile, voting and nomination screens. Tied to the login token, so another login
   *  fetches afresh; a failed request isn't kept, and profile edits clear it. */
  getProfile(): Observable<Member> {
    const token = this.auth.getToken();
    if (!this.profile$ || this.profileToken !== token) {
      this.profileToken = token;
      this.profile$ = this.http.get<Member>(`${this.apiUrl}/GetProfile`).pipe(
        tap({ error: () => this.clearProfileCache() }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.profile$;
  }

  clearProfileCache(): void {
    this.profile$ = undefined;
    this.profileToken = null;
  }

  private profile$?: Observable<Member>;
  private profileToken: string | null = null;
  getProfileImage(fileName: string) {
    return this.http.get(`${this.apiUrl}/GetProfileImageFile/${fileName}`);
  }

  // Upload new profile photo and update in Member table
  uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('File', file); // Must match the property name in DTO

    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/UploadProfileImage`, formData)
      .pipe(tap(() => this.clearProfileCache()));
  }
  updateMember(member: Member) {
    return this.http.post(`${this.apiUrl}/UpdateMember`, member)
      .pipe(tap(() => this.clearProfileCache()));
  }
}
