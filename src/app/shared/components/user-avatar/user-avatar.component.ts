import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import {
  GraphPhotoService,
  GraphPhotoSize,
} from '@core/services/graph-photo.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-user-photo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnChanges {
  private graphPhoto = inject(GraphPhotoService);

  /** Ruta dentro de `colibri_usr` para leer el token (por defecto "token"). */
  @Input() propPath = 'token';

  /** Si lo pasas, el componente usará este token explícito. */
  @Input() token?: string;

  /** Si es true, usa el interceptor (no lee token de storage ni input). */
  @Input() useInterceptor = false;

  /** Tamaño de la foto Graph. */
  @Input() size: GraphPhotoSize = '120x120';

  /** Fallback si no hay foto o falla la descarga. */
  @Input() fallbackSrc = 'assets/img/defaultUser.svg';

  /** Medidas y atributos del <img>. */
  @Input() width = 40;
  @Input() height = 40;
  @Input() alt = 'Foto de perfil';
  @Input() imgClass = 'rounded-circle';

  /** Emite click en la imagen (opcional). */
  @Output() avatarClick = new EventEmitter<void>();

  /** Flujo de la imagen (base64 o URL fallback). */
  avatar$: Observable<string | null> = of(this.fallbackSrc);

  /** Si hubo error de carga del <img>. */
  private failed = false;

  ngOnChanges(): void {
    this.rebuildStream();
  }

  /** Forzar refetch (útil después de cambiar la foto). */
  refresh(): void {
    this.graphPhoto.clearCache();
    this.rebuildStream();
  }

  onError(): void {
    if (!this.failed) {
      this.failed = true;
      this.avatar$ = of(this.fallbackSrc);
    }
  }

  private rebuildStream(): void {
    this.failed = false;

    if (this.useInterceptor) {
      this.avatar$ = this.graphPhoto.getPhotoDataUrl$(this.size, {
        defaultPhotoUrl: this.fallbackSrc,
        cacheEnabled: true,
      });
      return;
    }

    if (this.token && this.token.length > 0) {
      this.avatar$ = this.graphPhoto.getPhotoDataUrlWithToken$(
        this.token,
        this.size,
        {
          defaultPhotoUrl: this.fallbackSrc,
          cacheEnabled: true,
        },
      );
      return;
    }

    // Por defecto: leer token desde localStorage(colibri_usr[propPath])
    this.avatar$ = this.graphPhoto.getPhotoDataUrlFromStorage$(
      this.propPath,
      this.size,
      {
        defaultPhotoUrl: this.fallbackSrc,
        cacheEnabled: true,
      },
    );
  }
}
