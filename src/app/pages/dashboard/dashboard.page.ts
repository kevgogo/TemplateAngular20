import { Component } from '@angular/core';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxChartModule } from 'devextreme-angular/ui/chart';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [DxDataGridModule, DxChartModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  data = [
    { category: 'A', value: 12 },
    { category: 'B', value: 22 },
    { category: 'C', value: 8 },
  ];
}
