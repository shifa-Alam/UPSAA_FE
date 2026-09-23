import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MonthlyCount {
  year: number;
  month: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.baseUrl + '/Dashboard';

  constructor(private http: HttpClient) { }

  /** SuperAdmin/Admin only. New registrations per month, oldest first, zero-filled. */
  getRegistrationTrend(months = 12): Observable<MonthlyCount[]> {
    return this.http.get<MonthlyCount[]>(`${this.apiUrl}/RegistrationTrend?months=${months}`);
  }
}
