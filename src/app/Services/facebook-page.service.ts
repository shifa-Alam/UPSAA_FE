import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** A notice or event's Facebook page post state — filled by the API for admins only. */
export interface FacebookPostable {
  id: number;
  /** The admin ticked "also post on Facebook". */
  postToFacebook?: boolean | null;
  /** Set once posted ("pageid_postid"). */
  facebookPostId?: string | null;
  /** The last failure. */
  facebookError?: string | null;
  /** Automatic tries used up — only the "post now" button is left. */
  facebookGaveUp?: boolean | null;
}

export type FacebookPostKind = 'notice' | 'event';

@Injectable({ providedIn: 'root' })
export class FacebookPageService {
  private apiUrl = environment.baseUrl + '/FacebookPage';

  constructor(private http: HttpClient) { }

  /** Admin: post it on the page now (older items, or ones whose automatic tries failed). */
  postNow(kind: FacebookPostKind, id: number): Observable<{ postId: string | null }> {
    return this.http.post<{ postId: string | null }>(`${this.apiUrl}/${kind}/${id}`, {});
  }

  /** Link to a post from its Graph id ("pageid_postid"). */
  static postUrl(postId: string | null | undefined): string | null {
    return postId && /^\d+(_\d+)?$/.test(postId) ? `https://www.facebook.com/${postId}` : null;
  }
}
