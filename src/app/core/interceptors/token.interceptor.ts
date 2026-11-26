import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Manda el token de la sesión en cada petición a la API de Dentissa
 * («Authorization: Bearer <token>»). El servidor lo exige desde el 26/11/2026.
 * Si responde 401 (token vencido o cuenta desactivada), cierra la sesión y
 * vuelve al inicio de sesión.
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const esApi = req.url.startsWith(environment.apiUrl);

  const peticion =
    esApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (esApi && error instanceof HttpErrorResponse && error.status === 401 && auth.estaAutenticado()) {
        auth.cerrarSesion(false);
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
