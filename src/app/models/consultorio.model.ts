export type RolUsuario = 'super_admin' | 'doctor' | 'asistente';

export interface UsuarioSesion {
  id: number | string;
  nombre: string;
  apellido?: string;
  email: string;
  rol: RolUsuario;
  rol_etiqueta?: string;
  foto_perfil?: string | null;
}

export type DispositivoId =
  | 'LUCES'
  | 'VENTILADOR_1'
  | 'VENTILADOR_2'
  | 'VENTILADOR_3'
  | 'VENTILADOR_4';

export type ModoControl = 'AUTO' | 'MANUAL_ON' | 'MANUAL_OFF';
export type OrigenMovimiento = 'AUTOMATICO' | 'MANUAL';

export interface AsientoEstado {
  numero: number;
  hilera: 'IZQUIERDA' | 'DERECHA';
  ocupado: boolean;
  zonasVentilador: number[];
  vecesUsado: number;
}

export interface EstadoActuador {
  id: DispositivoId;
  nombre: string;
  zonaDescripcion: string;
  modo: ModoControl;
  encendido: boolean;
}

export interface RegistroAuditoria {
  id: number;
  usuarioNombre: string;
  rol: RolUsuario;
  rol_etiqueta?: string;
  dispositivo: string;
  accion: string;
  origen: OrigenMovimiento;
  fechaHora: Date;
}

export interface RegistroLlegadaQr {
  id: number;
  nombre: string;
  tipo: 'PACIENTE' | 'PERSONAL';
  codigoQr: string;
  horaLlegada: Date;
}

export interface EstadisticaAsiento {
  numero: number;
  hilera: 'IZQUIERDA' | 'DERECHA';
  ocupadoAhora: boolean;
  vecesUsado: number;
  porcentajeUso: number;
  tiempoTotalSegundos: number;
}