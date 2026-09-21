import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [MatIconModule, PageHeaderComponent, SectionCardComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {

}
