import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface CandidateBallot {
  id: number;
  name: string;
  photo?: any;
  batch?: number;
  ballotNumber?: number;
  alreadyVoted?: boolean;
}

export interface PositionBallot {
  id: number;
  name: string;
  maxSelect: number;
  priority: number;
  candidates: CandidateBallot[];
}
export interface Ballot {

  electionId: number;
  title: string;
  positions: PositionBallot[];

}
export interface ApiResponse {
  message: string;
}
export interface CandidateResult {
  candidateId: number;
  memberName: string;
  positionName: string;
  votes: number;
}

export interface PositionResult {
  positionId: number;
  positionName: string;
  totalVotes: number;
  winners: CandidateResult[];
}

export interface ElectionResult {
  electionId: number;
  electionTitle: string;
  electionDate: string;
  totalVotes: number;
  candidates: CandidateResult[];
  leadingCandidate?: CandidateResult;
  positions: PositionResult[];
  totalCandidate?:number;
  totalVoter?:number;
  totalPosition?:number;
}
@Injectable({
  providedIn: 'root'
})
export class VoteService {

  private apiUrl = environment.baseUrl + '/Vote';

  constructor(private http: HttpClient) { }

  submitVote(payload: { electionId: number; selections: { positionId: number; candidateIds: number[]; }[]; }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/cast-all`, payload);
  }
  getBallot(): Observable<Ballot> {
    return this.http.get<Ballot>(`${this.apiUrl}/GetBallot`);
  }
  checkVoterStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/CheckVoterStatus`);
  }
  getResultsByPosition(positionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/position/${positionId}/results`);
  }
  getElectionResults(electionId: number): Observable<ElectionResult> {
    return this.http.get<ElectionResult>(`${this.apiUrl}/results/${electionId}`);
  }
  filterElectionResults(electionId: number, positionId?: number): Observable<CandidateResult[]> {
  // 1️⃣ Build query params
  let params = new HttpParams().set('electionId', electionId.toString());

  if (positionId != null) {
    params = params.set('positionId', positionId.toString());
  }

  // 2️⃣ Call backend API
  return this.http.get<CandidateResult[]>(`${this.apiUrl}/FilterResult`, { params });
}

}
