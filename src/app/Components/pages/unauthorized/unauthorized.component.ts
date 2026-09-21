import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss'
})
export class UnauthorizedComponent {
   constructor(private router: Router) {}
  goHome() {
    this.router.navigate(['/']);
  }
}
