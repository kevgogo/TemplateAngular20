import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@Component({
  standalone: true,
  selector: 'app-basic-elements',
  imports: [FormsModule, DxFormModule, TooltipModule],
  templateUrl: './basic-elements.page.html'
})
export class BasicElementsPage {
  model = { name: '', email: '', newsletter: true };
}
