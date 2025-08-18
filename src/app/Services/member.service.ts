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
  id: number;
  fullName: string;
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


@Injectable({
  providedIn: 'root'
})
export class MemberService {
  //private apiUrl = 'https://test.kghdhaka.online/api/member'; // Your backend API URL
  // private apiUrl = 'http://localhost:5219/api/member'; // Your backend API URL
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

  requestActivation(memberId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/RequestActivation/${memberId}`, {});
  }

  getPendingRequests(): Observable<MemberActivationRequest[]> {
    return this.http.get<MemberActivationRequest[]>(`${this.apiUrl}/PendingActivations`);
  }

  approveRequest(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ApproveActivation/${requestId}`, {});
  }

  rejectRequest(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/RejectActivation`, { requestId });
  }

  activateMemberDirectly(memberId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ActivateDirect`, { memberId });
  }


  createUserFromMember(memberId: number, role: string = 'Representative'): Observable<any> {
    return this.http.post(`${this.authApiUrl}/CreateUserFromMember/${memberId}?role=${role}`, {});
  }
}
