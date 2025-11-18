// src/app/services/member.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  constructor(private http: HttpClient) { }

  registerMember(member: MemberCreateDto): Observable<any> {
    // Note: concatenate the path as a string
    return this.http.post(`${this.apiUrl}/RegisterMember`, member);
  }
  getMembers(): Observable<MemberCreateDto[]> {
    return this.http.get<MemberCreateDto[]>(`${this.apiUrl}/GetAllMembers`);
    // Adjust the endpoint as per your API route
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

  getProfile(): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/GetProfile`);
  }
  getProfileImage(fileName: string) {
    return this.http.get(`${this.apiUrl}/GetProfileImageFile/${fileName}`);
  }

  // Upload new profile photo and update in Member table
  uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('File', file); // Must match the property name in DTO

    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/UploadProfileImage`, formData);
  }
  updateMember(member: Member) {
    return this.http.post(`${this.apiUrl}/UpdateMember`, member);
  }
}
