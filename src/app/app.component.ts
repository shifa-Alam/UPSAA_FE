import { Component, ViewChild } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./Components/shared/navbar/navbar.component";
import { FooterComponent } from "./Components/shared/footer/footer.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBar, MatProgressBarModule } from "@angular/material/progress-bar";
import { LoadingService } from './Services/loading-service.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CommonModule, FooterComponent, MatToolbarModule, MatButtonModule, RouterModule, MatSidenavModule, MatIconModule, FooterComponent, MatProgressBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isLoading = false;
  title = 'upsaa';
  @ViewChild('sidenav') sidenav!: MatSidenav;

  toggleSidenav() {
    this.sidenav.toggle();
  }
  constructor(public loadingService: LoadingService) {
    
  }
}
