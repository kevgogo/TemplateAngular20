// src/app/features/demo/chrono/chrono-demo.page.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChronoComponent } from '@shared/components/chrono/chrono.component';

@Component({
  selector: 'app-chrono-demo',
  standalone: true,
  imports: [CommonModule, ChronoComponent],
  templateUrl: './chrono-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChronoDemoPage {}
