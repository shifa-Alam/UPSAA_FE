import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  @Input() icon = 'insights';
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() tone: 'primary' | 'accent' | 'neutral' = 'primary';
}
