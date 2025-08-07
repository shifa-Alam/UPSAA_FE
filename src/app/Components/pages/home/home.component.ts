import { Component } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import {MatDividerModule} from '@angular/material/divider';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule,MatDividerModule,RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
