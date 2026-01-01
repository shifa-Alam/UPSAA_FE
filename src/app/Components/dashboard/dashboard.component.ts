import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  collapsed = false;
  activeRoute = '';

  menuItems = [
    {
      label: 'Election Panel',
      icon: '🏛️',          // Represents governance / administration
      expanded: false,
      children: [
        { label: 'Elections', route: 'elections', icon: '📋' },
        { label: 'Positions', route: 'positions', icon: '🏷️' },
        { label: 'Candidates', route: 'candidates', icon: '🧑‍💼' },
        { label: 'Vote History', route: 'vote-casts', icon: '🗂️' }
      ]
    }
  ];



  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.activeRoute = event.urlAfterRedirects.split('/').pop() || '';
      }
    });
  }
  toggleMenu(item: any) {
    
    this.menuItems.forEach(i => {
      if (i !== item) i.expanded = false;
    });
    item.expanded = !item.expanded;
  }

  navigate(route: string) {
    if (this.activeRoute === route) return;
    this.activeRoute = route;
    this.router.navigateByUrl(`/dashboard/${route}`);
  }

}
