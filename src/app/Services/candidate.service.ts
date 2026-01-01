import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Candidate {
  id: number;
  candidateId: number;
  candidateName: string;

  memberId: number;
  memberName: string;
  adminNote: string;
  applicationReason: string;
  ballotNumber: number;
}
@Injectable({
  providedIn: 'root'
})
export class CandidateService {
private apiUrl = environment.baseUrl + '/Candidate';
 
  constructor(private http: HttpClient) { }

  // Add new candidate
  addCandidate(candidate: Candidate): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}/CreateCandidate`, candidate);
     
  }

  // Update existing candidate
  updateCandidate(candidate: Candidate): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.apiUrl}/${candidate.id}`, candidate);
  }

  // Get all candidates
  getCandidates(): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.apiUrl}/GetAllCandidates`);
  }

  // Delete candidate
  deleteCandidate(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
