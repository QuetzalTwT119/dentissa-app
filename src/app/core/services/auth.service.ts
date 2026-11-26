import { environment } from '../../../environments/environment';
import { Injectable, computed, signal } from '@angular/core';
import { RolUsuario, UsuarioSesion } from '../../models/consultorio.model';

export interface RespuestaLogin {
  ok: boolean;
  mensaje?: string;
}

const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  super_admin: 'Doctora titular',
  doctor: 'Doctor',
  asistente: 'Asistente',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'dentissa_sesion_v1';
  private readonly API_LOGIN_URL = `${environment.apiUrl}/app/login`;

  readonly usuarioActual = signal<UsuarioSesion | null>(this.cargarSesionGuardada());
  readonly esSuperAdmin = computed(() => this.usuarioActual()?.rol === 'super_admin');
  readonly esDoctor = computed(() => this.usuarioActual()?.rol === 'doctor');
  readonly esAsistente = computed(() => this.usuarioActual()?.rol === 'asistente');

  private normalizarRol(raw: unknown): RolUsuario | null {
    const val = String(raw ?? '').trim().toLowerCase();
    if (val === 'super_admin' || val === 'admin') return 'super_admin';
    if (val === 'doctor') return 'doctor';
    if (val === 'asistente') return 'asistente';
    return null;
  }

  private cargarSesionGuardada(): UsuarioSesion | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as UsuarioSesion;
      const rolNormalizado = this.normalizarRol(parsed.rol);
      if (!rolNormalizado) return null;
      return {
        ...parsed,
        rol: rolNormalizado,
        rol_etiqueta: parsed.rol_etiqueta || ETIQUETAS_ROL[rolNormalizado],
      };
    } catch {
      return null;
    }
  }

  estaAutenticado(): boolean {
    return this.usuarioActual() !== null;
  }

  tieneRol(...roles: RolUsuario[]): boolean {
    const actual = this.usuarioActual()?.rol;
    return !!actual && roles.includes(actual);
  }

  async iniciarSesion(email: string, password: string): Promise<RespuestaLogin> {
    const correoLimpio = email.trim().toLowerCase();
    if (!correoLimpio || !password) {
      return { ok: false, mensaje: 'Ingresa tu correo electrónico y contraseña.' };
    }

    try {
      const resp = await fetch(this.API_LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: correoLimpio,
          password,
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data?.ok) {
        return {
          ok: false,
          mensaje: data?.mensaje || data?.message || 'Correo o contraseña incorrectos.',
        };
      }

      const u = data.user;
      if (Number(u.activo) === 0) {
        return {
          ok: false,
          mensaje: 'Tu cuenta está desactivada. Contacta a la administradora.',
        };
      }

      const rolNormalizado = this.normalizarRol(u.rol);
      if (!rolNormalizado) {
        return {
          ok: false,
          mensaje: 'Acceso exclusivo para personal autorizado de la clínica.',
        };
      }

      const sesion: UsuarioSesion = {
        id: u.id,
        nombre: `${u.nombre} ${u.apellido || ''}`.trim(),
        apellido: u.apellido || '',
        email: u.email,
        rol: rolNormalizado,
        rol_etiqueta: u.rol_etiqueta || ETIQUETAS_ROL[rolNormalizado],
        foto_perfil: u.foto_perfil ?? null,
      };

      this.usuarioActual.set(sesion);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sesion));
      return { ok: true };
    } catch {
      return {
        ok: false,
        mensaje: 'No se pudo conectar con el servidor de Dentissa. Verifica tu conexión a internet.',
      };
    }
  }

  cerrarSesion(): void {
    this.usuarioActual.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}