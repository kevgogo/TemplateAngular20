import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';
import {
  APP_DESCRIPTION_TOKEN,
  APP_NAME_TOKEN,
  APP_VERSION_TOKEN,
  APP_BASE_HREF_TOKEN,
  APP_AUTHOR_TOKEN,
} from '@core/tokens/app-tokens';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, SHARED_IMPORTS],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly appName = inject(APP_NAME_TOKEN);
  readonly appDescription = inject(APP_DESCRIPTION_TOKEN);
  readonly baseHref = inject(APP_BASE_HREF_TOKEN);
  readonly version = inject(APP_VERSION_TOKEN);
  readonly author = inject(APP_AUTHOR_TOKEN);
}
