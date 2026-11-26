import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../../models/consultorio.model';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export function roleGuard(rolesPermitidos: RolUsuario[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaAutenticado()) {
      return router.createUrlTree(['/login']);
    }

    if (auth.tieneRol(...rolesPermitidos)) {
      return true;
    }

    return router.createUrlTree(['/tabs/sala']);
  };
}