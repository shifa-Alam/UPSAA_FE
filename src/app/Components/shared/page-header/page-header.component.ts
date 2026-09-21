import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  /** 'hero' = full dark gradient band (top-level pages), 'plain' = compact light header (inner/admin pages) */
  @Input() variant: 'hero' | 'plain' = 'hero';
}
