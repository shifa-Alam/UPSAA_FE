import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { AuthService } from '../../../Services/auth.service';

interface QuickLink { icon: string; labelKey: string; path: string; }

/**
 * Friendly "page not found" for any unknown URL: the crest as the "0" in 404, a
 * member search, and quick links — pointing into the portal / back office for
 * signed-in people, so nobody is dropped onto the public site.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TranslatePipe],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  query = '';

  /** '' for visitors, '/portal' for members, '/dashboard' for staff. */
  private get base(): string {
    if (!this.auth.isLoggedIn()) return '';
    return this.auth.isStaff() ? '/dashboard' : '/portal';
  }

  get homePath(): string {
    return this.base ? `${this.base}/home` : '/';
  }

  get links(): QuickLink[] {
    const b = this.base;
    // Staff's /dashboard/members and /dashboard/gallery are management screens —
    // send them to the public directory / gallery instead.
    const staff = b === '/dashboard';
    return [
      { icon: 'people', labelKey: 'notFound.links.members', path: staff ? '/members' : `${b}/members` },
      { icon: 'event', labelKey: 'notFound.links.events', path: staff ? '/events' : `${b}/events` },
      { icon: 'campaign', labelKey: 'notFound.links.notices', path: staff ? '/notices' : `${b}/notices` },
      { icon: 'photo_library', labelKey: 'notFound.links.gallery', path: staff ? '/gallery' : `${b}/gallery` },
      { icon: 'call', labelKey: 'notFound.links.contact', path: staff ? '/contact' : `${b}/contact` }
    ];
  }

  search(): void {
    const name = this.query.trim();
    const directory = this.base === '/portal' ? '/portal/members' : '/members';
    this.router.navigate([directory], { queryParams: name ? { name } : {} });
  }
}
