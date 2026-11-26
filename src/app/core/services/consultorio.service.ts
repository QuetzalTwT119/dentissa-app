import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AsientoEstado,
  DispositivoId,
  EstadisticaAsiento,
  EstadoActuador,
  ModoControl,
  OrigenMovimiento,
  RegistroAuditoria,
  RegistroLlegadaQr,
} from '../../models/consultorio.model';
import { AuthService } from './auth.service';

export type RangoEstadistica = 'hoy' | 'semana' | 'mes' | 'anio';

@Injectable({
  providedIn: 'root',
})
export class ConsultorioService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiIotUrl = `${environment.apiUrl}/iot`;

  private seqId = 1;
  private puertaTimer: ReturnType<typeof setTimeout> | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private relojStatsInterval: ReturnType<typeof setInterval> | null = null;
  private bloqueandoSync = false;

  private timersAuto = new Map<DispositivoId, ReturnType<typeof setTimeout>>();
  private intervalosCuenta = new Map<DispositivoId, ReturnType<typeof setInterval>>();
  readonly segundosRestantesAuto = signal<Partial<Record<DispositivoId, number>>>({});
  readonly tiempoRetornoAutoSeg = 5;

  readonly rangoEstadistica = signal<RangoEstadistica>('hoy');
  readonly mesSeleccionado = signal<number>(new Date().getMonth() + 1);
  readonly anioSeleccionado = signal<number>(new Date().getFullYear());
  readonly cargandoEstadisticas = signal<boolean>(false);
  readonly historialDisponible = signal<boolean>(true);
  readonly estadisticasHistoricas = signal<EstadisticaAsiento[]>([]);
  readonly entradasQrHistoricas = signal<number>(0);
  readonly entradasQrHoyBackend = signal<number>(0);

  private inicioOcupacionMs = new Map<number, number>();
  private segundosAcumulados = signal<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
  });
  private ahoraTick = signal<number>(Date.now());

  readonly capacidadMaxima = 6;
  readonly esp32EnLinea = signal<boolean>(false);
  readonly aforoActual = signal<number>(0);
  readonly puertaAbierta = signal<boolean>(false);
  readonly ultimaActualizacion = signal<Date>(new Date());

  readonly asientos = signal<AsientoEstado[]>([
    { numero: 1, hilera: 'IZQUIERDA', ocupado: false, zonasVentilador: [1], vecesUsado: 0 },
    { numero: 2, hilera: 'IZQUIERDA', ocupado: false, zonasVentilador: [1, 2], vecesUsado: 0 },
    { numero: 3, hilera: 'IZQUIERDA', ocupado: false, zonasVentilador: [2], vecesUsado: 0 },
    { numero: 4, hilera: 'DERECHA', ocupado: false, zonasVentilador: [3], vecesUsado: 0 },
    { numero: 5, hilera: 'DERECHA', ocupado: false, zonasVentilador: [3, 4], vecesUsado: 0 },
    { numero: 6, hilera: 'DERECHA', ocupado: false, zonasVentilador: [4], vecesUsado: 0 },
  ]);

  readonly luces = signal<EstadoActuador>({
    id: 'LUCES',
    nombre: 'Tira LED Sala',
    zonaDescripcion: 'Iluminación ambiental y acceso',
    modo: 'AUTO',
    encendido: false,
  });

  readonly ventiladores = signal<EstadoActuador[]>([
    { id: 'VENTILADOR_1', nombre: 'Ventilador 1', zonaDescripcion: 'Izq. Frontal (Asientos 1-2)', modo: 'AUTO', encendido: false },
    { id: 'VENTILADOR_2', nombre: 'Ventilador 2', zonaDescripcion: 'Izq. Fondo (Asientos 2-3)', modo: 'AUTO', encendido: false },
    { id: 'VENTILADOR_3', nombre: 'Ventilador 3', zonaDescripcion: 'Der. Frontal (Asientos 4-5)', modo: 'AUTO', encendido: false },
    { id: 'VENTILADOR_4', nombre: 'Ventilador 4', zonaDescripcion: 'Der. Fondo (Asientos 5-6)', modo: 'AUTO', encendido: false },
  ]);

  readonly telemetria = computed(() => ({
    capacidadMaxima: this.capacidadMaxima,
    esp32EnLinea: this.esp32EnLinea(),
    luces: this.luces(),
    ventiladores: this.ventiladores(),
    asientos: this.asientos(),
    puertaAbierta: this.puertaAbierta(),
    aforoActual: this.aforoActual(),
  }));

  readonly auditoria = signal<RegistroAuditoria[]>([]);
  readonly llegadasQr = signal<RegistroLlegadaQr[]>([]);

  readonly asientosOcupados = computed(
    () => this.asientos().filter((a) => a.ocupado).length
  );

  readonly citasAtendidasHoy = computed(
    () => Math.max(this.entradasQrHoyBackend(), this.llegadasQr().length)
  );

  readonly estadisticasAsientos = computed<EstadisticaAsiento[]>(() => {
    const rango = this.rangoEstadistica();
    if (rango !== 'hoy') {
      const hist = this.estadisticasHistoricas();
      if (hist.length > 0) return hist;
    }

    const lista = this.asientos();
    const acum = this.segundosAcumulados();
    const ahora = this.ahoraTick();
    const totalUsos = lista.reduce((acc, a) => acc + a.vecesUsado, 0) || 1;

    return lista.map((a) => {
      let segs = acum[a.numero] || 0;
      const inicioActual = this.inicioOcupacionMs.get(a.numero);
      if (a.ocupado && inicioActual) {
        segs += Math.floor((ahora - inicioActual) / 1000);
      }

      return {
        numero: a.numero,
        hilera: a.hilera,
        ocupadoAhora: a.ocupado,
        vecesUsado: a.vecesUsado,
        porcentajeUso: a.vecesUsado === 0 ? 0 : Math.round((a.vecesUsado / totalUsos) * 100),
        tiempoTotalSegundos: segs,
      };
    });
  });

  readonly resumenEstadisticas = computed(() => {
    const stats = this.estadisticasAsientos();
    const totalSesiones = stats.reduce((acc, s) => acc + s.vecesUsado, 0);
    const totalSegundos = stats.reduce((acc, s) => acc + s.tiempoTotalSegundos, 0);
    const promedioSegundos = totalSesiones > 0 ? Math.round(totalSegundos / totalSesiones) : 0;

    const masUsado = [...stats].sort((a, b) => b.vecesUsado - a.vecesUsado)[0];
    const asientoTop = masUsado && masUsado.vecesUsado > 0 ? `Silla #${masUsado.numero}` : 'Sin datos';
    const entradasQr =
      this.rangoEstadistica() === 'hoy'
        ? this.citasAtendidasHoy()
        : this.entradasQrHistoricas();

    return {
      totalSesiones,
      totalSegundos,
      promedioSegundos,
      asientoTop,
      entradasQr,
      demoraAlta: promedioSegundos > 900,
    };
  });

  constructor() {
    this.iniciarSincronizacionReal();
    this.relojStatsInterval = setInterval(() => {
      if (this.asientosOcupados() > 0 && this.rangoEstadistica() === 'hoy') {
        this.ahoraTick.set(Date.now());
      }
    }, 1000);
  }

  cambiarRangoEstadisticas(rango: RangoEstadistica): void {
    this.rangoEstadistica.set(rango);
    this.consultarEstadisticasFiltradas();
  }

  cambiarMesAnioEstadisticas(mes: number, anio: number): void {
    this.mesSeleccionado.set(Number(mes));
    this.anioSeleccionado.set(Number(anio));
    this.consultarEstadisticasFiltradas();
  }

  consultarEstadisticasFiltradas(): void {
    const rango = this.rangoEstadistica();
    const mes = this.mesSeleccionado();
    const anio = this.anioSeleccionado();
    this.cargandoEstadisticas.set(true);

    if (!this.historialDisponible()) {
      this.cargandoEstadisticas.set(false);
      return;
    }

    const url = `${this.apiIotUrl}/estadisticas?periodo=${rango}&mes=${mes}&anio=${anio}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.historialDisponible.set(true);
        this.cargandoEstadisticas.set(false);
        this.entradasQrHistoricas.set(Number(res?.total_entradas_qr || 0));

        if (Array.isArray(res?.asientos)) {
          const totalUsos =
            res.asientos.reduce((acc: number, x: any) => acc + Number(x.veces_usado || 0), 0) || 1;

          const mapeados: EstadisticaAsiento[] = this.asientos().map((base) => {
            const r = res.asientos.find((item: any) => Number(item.numero) === base.numero);
            const usos = Number(r?.veces_usado || 0);
            const segs = Number(r?.tiempo_total_segundos || 0);
            return {
              numero: base.numero,
              hilera: base.hilera,
              ocupadoAhora: base.ocupado,
              vecesUsado: usos,
              porcentajeUso: usos === 0 ? 0 : Math.round((usos / totalUsos) * 100),
              tiempoTotalSegundos: segs,
            };
          });

          if (rango === 'hoy') {
            const nuevosSegs: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            mapeados.forEach((m) => (nuevosSegs[m.numero] = m.tiempoTotalSegundos));
            this.segundosAcumulados.set(nuevosSegs);
            this.asientos.update((lista) =>
              lista.map((a) => {
                const m = mapeados.find((x) => x.numero === a.numero);
                return m ? { ...a, vecesUsado: Math.max(a.vecesUsado, m.vecesUsado) } : a;
              })
            );
          } else {
            this.estadisticasHistoricas.set(mapeados);
          }
        }
      },
      error: () => {
        this.esp32EnLinea.set(false);
      },
    });
  }

  async validarYAbrirPuertaQr(codigoQr: string): Promise<{ ok: boolean; mensaje: string }> {
    const limpio = codigoQr.trim();
    if (!limpio) {
      return { ok: false, mensaje: 'Código QR vacío.' };
    }

    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.apiIotUrl}/puerta/abrir`, { codigo_qr: limpio })
      );

      if (!res?.ok) {
        const msg = res?.mensaje || 'Código QR no válido en la base de datos.';
        this.registrarAuditoria('Lector QR Puerta', `Acceso denegado (${limpio})`, 'AUTOMATICO');
        return { ok: false, mensaje: msg };
      }

      const nombre = res.nombre || limpio;
      const tipo: 'PACIENTE' | 'PERSONAL' = res.tipo === 'PERSONAL' ? 'PERSONAL' : 'PACIENTE';

      this.puertaAbierta.set(true);
      this.entradasQrHoyBackend.update((v) => v + 1);
      if (this.rangoEstadistica() !== 'hoy') {
        this.entradasQrHistoricas.update((v) => v + 1);
      }

      if (tipo === 'PACIENTE' && this.aforoActual() < this.capacidadMaxima) {
        this.aforoActual.update((v) => v + 1);
      }

      this.llegadasQr.update((lista) => [
        { id: this.seqId++, nombre, tipo, codigoQr: limpio, horaLlegada: new Date() },
        ...lista,
      ]);

      if (!this.luces().encendido) {
        this.cambiarModoActuador('LUCES', 'MANUAL_ON', false);
      }
      this.recalcularAutomatizacion();
      this.registrarAuditoria(
        'Puerta Servomotor & LED',
        `Acceso QR válido: ${nombre} (${limpio})`,
        'AUTOMATICO'
      );

      if (this.puertaTimer) clearTimeout(this.puertaTimer);
      this.puertaTimer = setTimeout(() => {
        this.puertaAbierta.set(false);
        this.recalcularAutomatizacion();
      }, 3000);

      return { ok: true, mensaje: res.mensaje || `Puerta abierta para ${nombre}` };
    } catch (err: any) {
      const msg = err?.error?.mensaje || 'Código QR no registrado en la base de datos.';
      this.registrarAuditoria('Lector QR Puerta', `QR rechazado: ${limpio}`, 'AUTOMATICO');
      return { ok: false, mensaje: msg };
    }
  }

  iniciarSincronizacionReal(): void {
    this.sincronizarDesdeBackend();
    if (this.syncInterval) clearInterval(this.syncInterval);

    this.syncInterval = setInterval(() => {
      if (!this.bloqueandoSync) {
        this.sincronizarDesdeBackend();
      }
    }, 1000);
  }

  sincronizarDesdeBackend(): void {
    if (!this.historialDisponible()) {
      return;
    }

    this.http.get<any>(`${this.apiIotUrl}/estado`).subscribe({
      next: (res) => {
        const online = res?.esp32_en_linea !== undefined ? Boolean(res.esp32_en_linea) : true;
        this.esp32EnLinea.set(online);

        if (res?.entradas_qr_hoy !== undefined) {
          this.entradasQrHoyBackend.set(Number(res.entradas_qr_hoy));
        }

        if (Array.isArray(res.asientos)) {
          const ahora = Date.now();
          this.asientos.update((actuales) =>
            actuales.map((a) => {
              const remoto = res.asientos.find((r: any) => Number(r.numero) === a.numero);
              if (!remoto) return a;
              const ocupadoAhora = Boolean(remoto.ocupado);
              const incremento = !a.ocupado && ocupadoAhora ? 1 : 0;

              if (!a.ocupado && ocupadoAhora) {
                this.inicioOcupacionMs.set(a.numero, ahora);
              } else if (a.ocupado && !ocupadoAhora) {
                const inicio = this.inicioOcupacionMs.get(a.numero);
                if (inicio) {
                  const duracion = Math.max(1, Math.floor((ahora - inicio) / 1000));
                  this.segundosAcumulados.update((prev) => ({
                    ...prev,
                    [a.numero]: (prev[a.numero] || 0) + duracion,
                  }));
                  this.inicioOcupacionMs.delete(a.numero);
                }
              }

              if (a.ocupado !== ocupadoAhora) {
                if (!this.luces().encendido) {
                  this.cambiarModoActuador('LUCES', 'MANUAL_ON', false);
                }
                a.zonasVentilador.forEach((z) => {
                  const ventId = (`VENTILADOR_${z}`) as DispositivoId;
                  const vent = this.ventiladores().find((v) => v.id === ventId);
                  if (vent && vent.modo !== 'AUTO') {
                    this.cambiarModoActuador(ventId, 'AUTO', false);
                  }
                });
              }

              return {
                ...a,
                ocupado: ocupadoAhora,
                vecesUsado: remoto.vecesUsado ?? a.vecesUsado + incremento,
              };
            })
          );
          this.aforoActual.set(this.asientosOcupados());
        }

        if (Array.isArray(res.ventiladores)) {
          this.ventiladores.update((actuales) =>
            actuales.map((v, idx) => {
              const remoto = res.ventiladores.find((r: any) => Number(r.numero) === idx + 1);
              if (!remoto) return v;
              return {
                ...v,
                modo: (remoto.modo as ModoControl) || v.modo,
                encendido: Boolean(remoto.encendido),
              };
            })
          );
        }

        if (res.luces) {
          this.luces.update((l) => ({
            ...l,
            modo: (res.luces.modo as ModoControl) || l.modo,
            encendido: Boolean(res.luces.encendido),
          }));
        }

        this.ultimaActualizacion.set(new Date());
      },
      error: () => {
        this.esp32EnLinea.set(false);
      },
    });
  }

  alternarActuadorConRetornoAuto(id: DispositivoId): void {
    if (id === 'LUCES') {
      const siguiente: ModoControl = this.luces().encendido ? 'MANUAL_OFF' : 'MANUAL_ON';
      this.cambiarModoActuador('LUCES', siguiente, false);
      return;
    }

    const vent = this.ventiladores().find((v) => v.id === id);
    if (!vent) return;
    const siguiente: ModoControl = vent.encendido ? 'MANUAL_OFF' : 'MANUAL_ON';
    this.cambiarModoActuador(id, siguiente, true);
  }

  cambiarModoActuador(id: DispositivoId, nuevoModo: ModoControl, programarRetornoAuto = true): void {
    this.bloqueandoSync = true;
    this.limpiarTemporizadorAuto(id);

    if (id === 'LUCES') {
      const encendido =
        nuevoModo === 'MANUAL_ON'
          ? true
          : nuevoModo === 'MANUAL_OFF'
            ? false
            : this.aforoActual() > 0 || this.puertaAbierta();

      this.luces.update((l) => ({ ...l, modo: nuevoModo, encendido }));
      this.registrarAuditoria('Tira LED Sala', `Modo ${nuevoModo}`, 'MANUAL');
      this.enviarComandoActuador('LUCES', nuevoModo, encendido);
    } else {
      let estadoEncendido = false;
      this.ventiladores.update((lista) =>
        lista.map((v) => {
          if (v.id !== id) return v;
          const zonaNum = Number(id.split('_')[1]);
          const hayPresencia = this.asientos().some(
            (a) => a.ocupado && a.zonasVentilador.includes(zonaNum)
          );
          estadoEncendido =
            nuevoModo === 'MANUAL_ON'
              ? true
              : nuevoModo === 'MANUAL_OFF'
                ? false
                : hayPresencia;

          return { ...v, modo: nuevoModo, encendido: estadoEncendido };
        })
      );

      const vent = this.ventiladores().find((v) => v.id === id);
      this.registrarAuditoria(vent?.nombre || id, `Modo ${nuevoModo}`, 'MANUAL');
      this.enviarComandoActuador(id, nuevoModo, estadoEncendido);
    }

    if (programarRetornoAuto && nuevoModo !== 'AUTO') {
      this.programarRegresoAuto(id);
    }
  }

  private programarRegresoAuto(id: DispositivoId): void {
    let restantes = this.tiempoRetornoAutoSeg;
    this.segundosRestantesAuto.update((map) => ({ ...map, [id]: restantes }));

    const intervalo = setInterval(() => {
      restantes -= 1;
      if (restantes > 0) {
        this.segundosRestantesAuto.update((map) => ({ ...map, [id]: restantes }));
      } else {
        this.limpiarTemporizadorAuto(id);
      }
    }, 1000);

    const timeout = setTimeout(() => {
      this.limpiarTemporizadorAuto(id);
      this.cambiarModoActuador(id, 'AUTO', false);
    }, this.tiempoRetornoAutoSeg * 1000);

    this.intervalosCuenta.set(id, intervalo);
    this.timersAuto.set(id, timeout);
  }

  private limpiarTemporizadorAuto(id: DispositivoId): void {
    const t = this.timersAuto.get(id);
    if (t) clearTimeout(t);
    this.timersAuto.delete(id);

    const i = this.intervalosCuenta.get(id);
    if (i) clearInterval(i);
    this.intervalosCuenta.delete(id);

    this.segundosRestantesAuto.update((map) => {
      const copia = { ...map };
      delete copia[id];
      return copia;
    });
  }

  restablecerTodoAuto(): void {
    this.cambiarModoActuador('LUCES', 'AUTO', false);
    this.ventiladores().forEach((v) => this.cambiarModoActuador(v.id, 'AUTO', false));
  }

  apagarTodo(): void {
    this.cambiarModoActuador('LUCES', 'MANUAL_OFF', false);
    this.ventiladores().forEach((v) => this.cambiarModoActuador(v.id, 'MANUAL_OFF', false));
    this.registrarAuditoria('Sala Completa', 'Apagado general (Leds y ventiladores)', 'MANUAL');
  }

  private enviarComandoActuador(dispositivo: DispositivoId, modo: ModoControl, encendido: boolean): void {
    this.http
      .post(`${this.apiIotUrl}/actuadores`, {
        dispositivo,
        modo,
        encendido,
        ventiladores: this.ventiladores().map((v, i) => ({
          numero: i + 1,
          modo: v.modo,
          encendido: v.encendido,
        })),
      })
      .subscribe({
        next: () => (this.bloqueandoSync = false),
        error: () => (this.bloqueandoSync = false),
      });
  }

  alternarPuertaManual(): void {
    const abrir = !this.puertaAbierta();
    this.puertaAbierta.set(abrir);
    if (this.puertaTimer) clearTimeout(this.puertaTimer);

    if (abrir) {
      this.http.post(`${this.apiIotUrl}/puerta/abrir`, { codigo_qr: 'MANUAL_APP' }).subscribe({
        error: () => {},
      });
      if (!this.luces().encendido) {
        this.cambiarModoActuador('LUCES', 'MANUAL_ON', false);
      }
      this.recalcularAutomatizacion();
      this.registrarAuditoria('Puerta Servomotor', 'Apertura manual desde app', 'MANUAL');

      this.puertaTimer = setTimeout(() => {
        this.puertaAbierta.set(false);
        this.recalcularAutomatizacion();
      }, 3000);
    } else {
      this.recalcularAutomatizacion();
      this.registrarAuditoria('Puerta Servomotor', 'Cierre manual desde app', 'MANUAL');
    }
  }
  private recalcularAutomatizacion(): void {
    const hayPersonas = this.aforoActual() > 0 || this.asientosOcupados() > 0;
    const puerta = this.puertaAbierta();

    if (hayPersonas && !this.luces().encendido && this.luces().modo === 'AUTO') {
      this.cambiarModoActuador('LUCES', 'MANUAL_ON', false);
    }

    const asientosActuales = this.asientos();
    this.ventiladores.update((lista) =>
      lista.map((v) => {
        if (v.modo !== 'AUTO') return v;
        const zonaNum = Number(v.id.split('_')[1]);
        const ocupadoEnZona = asientosActuales.some(
          (a) => a.ocupado && a.zonasVentilador.includes(zonaNum)
        );
        return { ...v, encendido: ocupadoEnZona };
      })
    );

    this.ultimaActualizacion.set(new Date());
  }

  private registrarAuditoria(dispositivo: string, accion: string, origen: OrigenMovimiento): void {
    const user = this.auth.usuarioActual();
    this.auditoria.update((lista) => [
      {
        id: this.seqId++,
        usuarioNombre: origen === 'AUTOMATICO' ? 'Sistema IoT' : user?.nombre || 'Personal',
        rol: user?.rol || 'super_admin',
        dispositivo,
        accion,
        origen,
        fechaHora: new Date(),
      },
      ...lista.slice(0, 29),
    ]);
  }
}


