import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [PageHeaderComponent, SectionCardComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {

}
