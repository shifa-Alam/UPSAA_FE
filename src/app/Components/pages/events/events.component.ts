import { Component } from '@angular/core';
import { UnderConstructionComponent } from "../under-construction/under-construction.component";

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [UnderConstructionComponent],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent {

}
