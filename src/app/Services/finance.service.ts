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
  attachmentUrl?: string | null;
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

export interface MonthlyTotal {
  year: number;
  month: number;
  income: number;
  expense: number;
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
  monthlyTotals: MonthlyTotal[];
  /** Null unless a start date is set with no type/category filter. */
  openingBalance: number | null;
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

  /** file is the proof/receipt to attach — optional, image or PDF. */
  createEntry(entry: LedgerEntryInput, file?: File | null): Observable<LedgerEntry> {
    return this.http.post<LedgerEntry>(`${this.apiUrl}/CreateEntry`, this.toFormData(entry, file));
  }

  /** Omit file to leave the existing attachment (if any) untouched. */
  updateEntry(id: number, entry: LedgerEntryInput, file?: File | null): Observable<LedgerEntry> {
    return this.http.put<LedgerEntry>(`${this.apiUrl}/${id}`, this.toFormData(entry, file));
  }

  private toFormData(entry: LedgerEntryInput, file?: File | null): FormData {
    const formData = new FormData();
    formData.append('EntryDate', entry.entryDate);
    formData.append('Type', entry.type);
    formData.append('Category', entry.category);
    if (entry.description) formData.append('Description', entry.description);
    formData.append('Amount', String(entry.amount));
    if (entry.reference) formData.append('Reference', entry.reference);
    if (file) formData.append('File', file);
    return formData;
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Attachment endpoints are staff-only, so a plain <a href> won't carry the
   *  JWT — fetch as a blob through HttpClient (the auth interceptor attaches
   *  the token) and the caller turns that into a browser download. */
  downloadAttachment(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }
}
