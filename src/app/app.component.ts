import { Component, ViewChild } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./Components/shared/navbar/navbar.component";
import { FooterComponent } from "./Components/shared/footer/footer.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, MatToolbarModule, MatButtonModule, RouterModule, MatSidenavModule, MatIconModule, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'upsaa';
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
    toggleSidenav() {
      this.sidenav.toggle();
    }
}
