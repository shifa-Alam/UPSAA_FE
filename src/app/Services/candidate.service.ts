import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Candidate {
  id?: number;
  positionId?: number;
  positionName?: string;

  memberId?: number;
  memberName?: string;
  memberCode?: string;
  adminNote?: string;
  applicationReason?: string;
  ballotNumber?: number;
  batch?: number;
  nominationStatus?: string;
  isPaid?: boolean;
  fee?: number;
}

export interface PaginatedCandidatesResponse {
  candidates: Candidate[];
  totalItems: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  totalFee: number;
  paidFee: number;

}
export interface CandidateFilterDto {
  positionId?: number;
  memberName?: string;
  memberCode?: string;
  nominationStatusId?: number | null;

  ballotNumber?: number;
  batch?: number;
  isPaid?: boolean | null;
  fee?: number;
  active?: boolean;

  pageNumber: number;
  pageSize: number;
}
@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  filterCandidates(filter: CandidateFilterDto): Observable<PaginatedCandidatesResponse> {
    console.log(filter)
    return this.http.post<PaginatedCandidatesResponse>(`${this.apiUrl}/FilterCandidates`, filter);
  }

  private apiUrl = environment.baseUrl + '/Candidate';

  constructor(private http: HttpClient) { }

  // Add new candidate
  applyNomination(candidate: Candidate): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}/ApplyNomination`, candidate);

  }
  addCandidate(candidate: Candidate): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}/CreateCandidate`, candidate);

  }
  // Update existing candidate
  updateCandidate(candidate: Candidate): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.apiUrl}/${candidate.id}`, candidate);
  }

  // Get all candidates
  getCandidates(electionId: number): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.apiUrl}/${electionId}/GetAllCandidates`);
  }

  // Delete candidate
  deleteCandidate(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ✅ Approve / Reject / Undo decision
  decideCandidate(candidateId: number, decision: Candidate): Observable<any> {
    return this.http.post(`${this.apiUrl}/${candidateId}/decision`, decision);
  }

  updatePaymentStatus(candidateId: number | null | undefined, isPaid: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${candidateId}/payment?isPaid=${isPaid}`, {});
  }
}
