import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Election {
  id: number;
  title: string;
  startTime: any;
  endTime: any;
}
@Injectable({
  providedIn: 'root'
})
export class ElectionService {
private apiUrl = environment.baseUrl + '/Election';
 
  constructor(private http: HttpClient) { }

  // Add new election
  addElection(election: Election): Observable<Election> {
    return this.http.post<Election>(`${this.apiUrl}/CreateElection`, election);
     
  }

  // Update existing election
  updateElection(election: Election): Observable<Election> {
    return this.http.put<Election>(`${this.apiUrl}/${election.id}`, election);
  }

  // Get all elections
  getElections(): Observable<Election[]> {
    return this.http.get<Election[]>(`${this.apiUrl}/GetAllElections`);
  }

  // Delete election
  deleteElection(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
