import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserRoleItem {
  userId: string;
  email: string | null;
  phone: string | null;
  memberId: number | null;
  memberName: string | null;
  batch: number | null;
  role: string | null;
  /** The signed-in SuperAdmin's own account — its role can't be changed. */
  isSelf: boolean;
}

export interface UserRoleListResponse {
  users: UserRoleItem[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
}

export interface UserRoleFilter {
  search?: string;
  role?: string;
  pageNumber: number;
  pageSize: number;
}

/** SuperAdmin only — every endpoint here returns 403 for anyone else. */
@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private apiUrl = environment.baseUrl + '/UserManagement';

  constructor(private http: HttpClient) { }

  getUsers(filter: UserRoleFilter): Observable<UserRoleListResponse> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);
    if (filter.search?.trim()) params = params.set('search', filter.search.trim());
    if (filter.role) params = params.set('role', filter.role);
    return this.http.get<UserRoleListResponse>(`${this.apiUrl}/users`, { params });
  }

  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles`);
  }

  /** Takes effect at the user's next login — the role is carried in their token. */
  changeRole(userId: string, role: string): Observable<{ role: string }> {
    return this.http.put<{ role: string }>(`${this.apiUrl}/users/${encodeURIComponent(userId)}/role`, { role });
  }
}
