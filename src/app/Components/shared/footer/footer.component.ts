import { CommonModule } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();

  constructor(private host: ElementRef<HTMLElement>) { }

  /** The page scrolls inside the app shell, not the window — scroll whichever ancestor actually scrolls. */
  backToTop(): void {
    let el: HTMLElement | null = this.host.nativeElement.parentElement;
    while (el && el.scrollHeight <= el.clientHeight) el = el.parentElement;
    (el ?? document.scrollingElement ?? document.documentElement).scrollTo({ top: 0, behavior: 'smooth' });
  }
}
