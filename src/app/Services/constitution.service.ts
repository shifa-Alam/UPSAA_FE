import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** The association's current constitution PDF. There is only ever one. */
export interface ConstitutionDocument {
  /** Behind [Authorize] — fetch it through open(), never as a plain link. */
  fileUrl: string;
  fileName: string;
  /** UTC ISO timestamp ending in "Z". */
  uploadedAt: string;
  uploadedByName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConstitutionService {
  private apiUrl = environment.baseUrl + '/Constitution';

  constructor(private http: HttpClient) { }

  /** Any logged-in role. Returns null (204 No Content) when nothing has been uploaded yet. */
  getCurrent(): Observable<ConstitutionDocument | null> {
    return this.http.get<ConstitutionDocument | null>(`${this.apiUrl}/GetCurrent`);
  }

  /** SuperAdmin/Admin only. Replaces the current document if there is one. */
  upload(file: File): Observable<ConstitutionDocument> {
    const formData = new FormData();
    formData.append('File', file);
    return this.http.post<ConstitutionDocument>(`${this.apiUrl}/Upload`, formData);
  }

  /** SuperAdmin/Admin only. */
  delete(): Observable<void> {
    return this.http.delete<void>(this.apiUrl);
  }

  /**
   * The PDF is members-only, so a bare <a href> (which sends no bearer token) would
   * get 401. Fetch it through HttpClient — the auth interceptor adds the token — and
   * hand the browser a local blob URL instead.
   *
   * 'view' opens the tab synchronously, before the request, so popup blockers treat
   * it as part of the user's tap; the tab is pointed at the PDF once it arrives.
   */
  open(doc: ConstitutionDocument, mode: 'view' | 'download', onError: () => void): void {
    const tab = mode === 'view' ? window.open('', '_blank') : null;

    this.http.get(doc.fileUrl, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        if (mode === 'view' && tab) {
          tab.location.href = url;
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.fileName || 'constitution.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
        // Long enough for the new tab / download to take the blob.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        tab?.close();
        onError();
      }
    });
  }
}
