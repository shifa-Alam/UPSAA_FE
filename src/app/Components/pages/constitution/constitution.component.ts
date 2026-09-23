import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

@Component({
  selector: 'app-constitution',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe],
  templateUrl: './constitution.component.html',
  styleUrl: './constitution.component.scss'
})
export class ConstitutionComponent {
  /**
   * Set this once the association's constitution PDF is added under
   * `public/assets/documents/constitution.pdf` (or update the path) —
   * the download/view card below appears automatically once this is true.
   */
  documentAvailable = false;
  documentUrl = 'assets/documents/constitution.pdf';
}
