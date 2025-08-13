import { Component } from '@angular/core';
import { UnderConstructionComponent } from "../under-construction/under-construction.component";

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [UnderConstructionComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {

}
