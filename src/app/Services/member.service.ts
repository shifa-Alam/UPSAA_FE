// src/app/services/member.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MemberCreateDto {
  fullName: string;
  gender:string;
  email: string;
  phone: string;
  batch: number;
  currentDesignation?: string;
  institute?: string;
  heighestEducation?: string;
  currentCity:string;
  dob?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private apiUrl = 'https://test.kghdhaka.online/api/member'; // Your backend API URL
// private apiUrl = 'http://localhost:5219/api/member'; // Your backend API URL

  constructor(private http: HttpClient) {}

  registerMember(member: MemberCreateDto): Observable<any> {
    // Note: concatenate the path as a string
    return this.http.post(`${this.apiUrl}/RegisterMember`, member);
  }
  getMembers(): Observable<MemberCreateDto[]> {
    return this.http.get<MemberCreateDto[]>(`${this.apiUrl}/GetAllMembers`); 
    // Adjust the endpoint as per your API route
  }
}
