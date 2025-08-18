import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  email: string;
  userName: string;
  role: string;
}

interface JwtPayload {
  id: string;
  role: string;
  Batch?: number;
  MemberId?: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.baseUrl+'/auth';
  private tokenKey = 'authToken';
  private userSubject = new BehaviorSubject<JwtPayload | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getToken();
    if (token) this.userSubject.next(this.decodeToken(token));
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      map(res => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.tokenKey, res.token);
        }
        const decoded = this.decodeToken(res.token);
        this.userSubject.next(decoded);
        return decoded;
      })
    );
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
    }
    this.userSubject.next(null);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    return decoded.exp * 1000 > Date.now();
  }

  getCurrentUser(): JwtPayload | null {
    return this.userSubject.value;
  }

  private decodeToken(token: string): JwtPayload {
    return jwtDecode<JwtPayload>(token);
  }
}


