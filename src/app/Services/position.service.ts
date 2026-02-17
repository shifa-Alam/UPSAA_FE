import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Candidate } from './candidate.service';

export interface Position {
  id: number;
  name: string;
  electionId: number;
  electionTitle: string;
  maxSelect: number;
  priority: number;
  fee: number;
  candidates: Candidate[];
}
@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private apiUrl = environment.baseUrl + '/Position';

  constructor(private http: HttpClient) { }

  // Add new position
  addPosition(position: Position): Observable<Position> {
    return this.http.post<Position>(`${this.apiUrl}/CreatePosition`, position);

  }

  // Update existing position
  updatePosition(position: Position): Observable<Position> {
    return this.http.put<Position>(`${this.apiUrl}/${position.id}`, position);
  }

  // Get all positions
  getPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.apiUrl}/GetAllPositions`);
  }

  // Delete position
  deletePosition(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Delete/${id}`);
  }
}
