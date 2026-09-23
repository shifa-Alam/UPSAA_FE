import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
}
