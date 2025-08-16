import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { CommonService } from '@core/services/common.service';
// Si tienes AuthService, úsalo para token:
import { AuthService } from '@core/services/auth.service';

// Para poder "saltar" el interceptor en llamadas como /login o /assets/i18n
export const SKIP_AUTH_CTX = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const common = inject(CommonService);
  const router = inject(Router);
  const auth = inject(AuthService);

  // lee token de tu AuthService (o de common si aún no tienes AuthService)
  const token = auth.token?.(); // ajusta a tu implementación
  const skip = req.context.get(SKIP_AUTH_CTX);

  const req2 =
    !skip && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(req2).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        common.redirecToUnauthorized({
          code: '401',
          error: 'No autorizado',
          message:
            'Su token ha caducado o está intentando acceder a una zona no autorizada',
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
