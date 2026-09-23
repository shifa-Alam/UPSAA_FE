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
  /** 'hero' = full-height band (content pages), 'plain' = same look, compact (directory/forms) */
  @Input() variant: 'hero' | 'plain' = 'hero';
}
