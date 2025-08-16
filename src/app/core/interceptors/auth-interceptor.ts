// src/app/core/interceptors/auth-interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { SettingsService } from '@core/services/settings.service';
import { CommonService } from '@core/services/common.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const settings = inject(SettingsService);
  const common = inject(CommonService);

  const token: string | undefined = settings.getUserSetting('token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        common.redirecToUnauthorized({
          code: '401',
          error: 'No autorizado',
          message: 'Su token ha caducado o no es válido',
        });
      } else if (err.status === 503 || err.status === 0) {
        common.redirecToError({
          code: '503',
          error: 'Error',
          message: 'Servicio no disponible',
        });
      } else if (err.status === 400) {
        common.redirecToError({
          code: '400',
          error: 'Credenciales',
          message: 'Credenciales vencidas, vuelva a hacer login',
        });
      }
      return throwError(() => err);
    })
  );
};
