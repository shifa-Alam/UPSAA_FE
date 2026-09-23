import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, RevealDirective, TranslatePipe],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  readonly address = 'Thana Road, Jhenaigati, Sherpur 2120';
  readonly mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.address)}`;

  /** Same channels as the site footer. */
  readonly channels = [
    { icon: 'thumb_up', url: 'https://www.facebook.com/uttaranalumni/', nameKey: 'contact.social.pageName', hintKey: 'contact.social.pageHint' },
    { icon: 'groups_2', url: 'https://www.facebook.com/groups/24644376638521350/', nameKey: 'contact.social.groupName', hintKey: 'contact.social.groupHint' },
    { icon: 'chat', url: 'https://wa.me/8801866293776', nameKey: 'contact.social.whatsappName', hintKey: 'contact.social.whatsappHint' },
  ];
}
