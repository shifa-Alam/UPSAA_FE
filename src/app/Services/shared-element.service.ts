import { Injectable, signal } from '@angular/core';

/**
 * Which member's photo should "fly" between the directory and their profile.
 * The browser's view transition matches the one element named `member-photo` on the
 * old page with the one on the new page, so only the clicked card carries the name —
 * and, coming back, only that same card in the directory.
 */
@Injectable({ providedIn: 'root' })
export class SharedElementService {
  readonly memberId = signal<number | null>(null);

  /** What the directory card already shows, so the profile header can draw instantly —
   *  the photo must exist on the new page when the transition snapshots it. */
  preview: MemberPreview | null = null;

  open(member: MemberPreview): void {
    this.memberId.set(member.id);
    this.preview = member;
  }
}

export interface MemberPreview {
  id: number;
  fullName: string;
  photo?: string | null;
  batch: number;
  currentDesignation?: string | null;
  employer?: string | null;
  currentCity?: string | null;
  bloodGroup?: string | null;
  memberCode?: string | null;
}
