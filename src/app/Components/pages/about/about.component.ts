import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, RevealDirective, TranslatePipe],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  readonly goalKeys = ['about.goals.item1', 'about.goals.item2', 'about.goals.item3', 'about.goals.item4'];

  readonly activities = [
    { icon: 'celebration', key: 'about.activities.item1' },
    { icon: 'school', key: 'about.activities.item2' },
    { icon: 'volunteer_activism', key: 'about.activities.item3' },
    { icon: 'menu_book', key: 'about.activities.item4' },
  ];

  constructor(private languageService: LanguageService) { }

  /** "01", "02"… in the active script (০১, ০২… in Bangla). */
  numeral(n: number): string {
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(n);
  }
}
