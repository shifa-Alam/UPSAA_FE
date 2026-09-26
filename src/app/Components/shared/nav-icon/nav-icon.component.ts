import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

// Small, fixed set of feather-style line icons used across the admin sidebar —
// one shared component instead of a Material icon per row, so the sidebar's
// icon language stays consistent and doesn't depend on the Material Icons font.
export type NavIconName =
  | 'layers' | 'calendar' | 'tag' | 'user-check' | 'clock' | 'users'
  | 'folder' | 'image' | 'megaphone' | 'dollar' | 'gift' | 'award' | 'graduation-cap'
  | 'briefcase' | 'droplet' | 'book' | 'quote'
  | 'collapse' | 'sun' | 'moon' | 'logout' | 'dashboard';

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-icon.component.html',
  styleUrl: './nav-icon.component.scss'
})
export class NavIconComponent {
  @Input() name: NavIconName = 'layers';
}
