import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface CandidateBallot {
  id: number;
  name: string;
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


}
