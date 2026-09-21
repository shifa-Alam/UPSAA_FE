import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-section-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './section-card.component.html',
  styleUrl: './section-card.component.scss'
})
export class SectionCardComponent {
  @Input() icon = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() noPadding = false;
}
