import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, NavigationEnd,RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet,CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
collapsed = false;
  activeRoute = '';

  menuItems = [
   
    { label: 'Elections', route: 'elections', icon: '🗳️' },
    { label: 'Positions', route: 'positions', icon: '📌' },
     { label: 'Candidates', route: 'candidates', icon: '👤' },
    { label: 'Vote Casts', route: 'vote-casts', icon: '✅' }
  ];

  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.activeRoute = event.urlAfterRedirects.split('/').pop() || '';
      }
    });
  }

  navigate(route: string) {
    this.router.navigate([`/dashboard/${route}`]);
  }
}
