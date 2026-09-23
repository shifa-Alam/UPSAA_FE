import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type LedgerType = 'Income' | 'Expense';

export interface LedgerEntry {
  id: number;
  entryDate: string;
  type: LedgerType;
  category: string;
  description?: string | null;
  amount: number;
  reference?: string | null;
}

export interface LedgerEntryInput {
  entryDate: string;
  type: LedgerType;
  category: string;
  description?: string;
  amount: number;
  reference?: string;
}

export interface LedgerFilter {
  from?: string;
  to?: string;
  type?: LedgerType | '';
  category?: string;
  pageNumber: number;
  pageSize: number;
}

export interface CategoryTotal {
  category: string;
  amount: number;
}

export interface LedgerSummaryResponse {
  entries: LedgerEntry[];
  totalItems: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private apiUrl = environment.baseUrl + '/Finance';

  constructor(private http: HttpClient) { }

  filter(filter: LedgerFilter): Observable<LedgerSummaryResponse> {
    return this.http.post<LedgerSummaryResponse>(`${this.apiUrl}/Filter`, filter);
  }

  getCategories(type?: LedgerType): Observable<string[]> {
    const query = type ? `?type=${type}` : '';
    return this.http.get<string[]>(`${this.apiUrl}/Categories${query}`);
  }

  createEntry(entry: LedgerEntryInput): Observable<LedgerEntry> {
    return this.http.post<LedgerEntry>(`${this.apiUrl}/CreateEntry`, entry);
  }

  updateEntry(id: number, entry: LedgerEntryInput): Observable<LedgerEntry> {
    return this.http.put<LedgerEntry>(`${this.apiUrl}/${id}`, entry);
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
