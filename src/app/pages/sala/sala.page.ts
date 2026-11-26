import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  downloadOutline,
  logOutOutline,
  peopleOutline,
  powerOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { MapaAsientosComponent } from '../../components/mapa-asientos/mapa-asientos.component';
import { AuthService } from '../../core/services/auth.service';
import { ConsultorioService, RangoEstadistica } from '../../core/services/consultorio.service';

@Component({
  selector: 'app-sala',
  standalone: true,
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    MapaAsientosComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background: #B01E53; --color: #FFFFFF;">
        <ion-title>Dentissa • Sala de Espera</ion-title>
        <ion-buttons slot="end">
          <div class="esp-status-pill" [class.esp-online]="consultorio.esp32EnLinea()">
            <span class="dot"></span>
            <span>{{ consultorio.esp32EnLinea() ? 'ESP32 En Línea' : 'ESP32 Desconectado' }}</span>
          </div>
          <ion-button (click)="salir()" title="Cerrar sesión">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="sala-content">
      <div class="main-container">
        <!-- TARJETA SUPERIOR: USUARIO Y KPIS -->
        <div class="card-box user-hero-tint">
          <div class="top-user-row">
            <div class="user-profile-left">
              @if (fotoPerfilUrl() && !fotoError()) {
                <img
                  [src]="fotoPerfilUrl()"
                  alt="Foto de perfil"
                  class="avatar-img"
                  (error)="fotoError.set(true)"
                />
              } @else {
                <div class="avatar-circle">{{ inicialesUsuario() }}</div>
              }
              <div>
                <div class="user-name">{{ auth.usuarioActual()?.nombre || 'Personal Dentissa' }}</div>
                <div class="badges-row">
                  <div class="role-chip">
                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                    <span>{{ etiquetaRol() }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="aforo-badge">
              <ion-icon name="people-outline"></ion-icon>
              <span>{{ consultorio.aforoActual() }}/{{ consultorio.capacidadMaxima }}</span>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-item">
              <div class="kpi-val">{{ ventiladoresActivos() }}/4</div>
              <div class="kpi-lbl">Ventiladores Activos</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-val">{{ consultorio.citasAtendidasHoy() }}</div>
              <div class="kpi-lbl">Accesos QR Hoy</div>
            </div>
          </div>
        </div>

        <!-- VISTA 1: SALA DE ESPERA -->
        @if (vistaActiva() === 'plano') {
          <div class="card-box">
            <div class="card-header-flex">
              <div class="card-title">Sala de Espera</div>
              <button
                type="button"
                class="reset-auto-btn"
                [disabled]="!hayAlgoEncendido()"
                [style.opacity]="hayAlgoEncendido() ? '1' : '0.45'"
                (click)="consultorio.apagarTodo()"
              >
                <ion-icon name="power-outline"></ion-icon>
                Apagar todo
              </button>
            </div>
            <app-mapa-asientos></app-mapa-asientos>
          </div>
        }

        <!-- VISTA 2: ESTADÍSTICAS -->
        @if (vistaActiva() === 'stats') {
          <div class="card-box">
            <div class="card-header-flex">
              <div class="card-title">
                <ion-icon name="bar-chart-outline"></ion-icon>
                Métricas de Ocupación ({{ etiquetaPeriodo() }})
              </div>
              <button type="button" class="reset-auto-btn" (click)="exportarEstadisticasCsv()">
                <ion-icon name="download-outline"></ion-icon>
                Exportar CSV
              </button>
            </div>

            <div class="periodo-bar">
              <button
                type="button"
                class="p-btn"
                [class.p-sel]="consultorio.rangoEstadistica() === 'hoy'"
                (click)="seleccionarPeriodo('hoy')"
              >Hoy</button>
              <button
                type="button"
                class="p-btn"
                [class.p-sel]="consultorio.rangoEstadistica() === 'semana'"
                (click)="seleccionarPeriodo('semana')"
              >Semana</button>
              <button
                type="button"
                class="p-btn"
                [class.p-sel]="consultorio.rangoEstadistica() === 'mes'"
                (click)="seleccionarPeriodo('mes')"
              >Mes</button>
              <button
                type="button"
                class="p-btn"
                [class.p-sel]="consultorio.rangoEstadistica() === 'anio'"
                (click)="seleccionarPeriodo('anio')"
              >Año</button>
            </div>

            @if (consultorio.rangoEstadistica() === 'mes' || consultorio.rangoEstadistica() === 'anio') {
              <div class="fecha-filtros-row">
                @if (consultorio.rangoEstadistica() === 'mes') {
                  <label class="filtro-label">
                    <span>Mes:</span>
                    <select
                      class="filtro-select"
                      [value]="consultorio.mesSeleccionado()"
                      (change)="onCambiarMes($event)"
                    >
                      @for (m of mesesLista; track m.valor) {
                        <option [value]="m.valor" [selected]="m.valor === consultorio.mesSeleccionado()">
                          {{ m.nombre }}
                        </option>
                      }
                    </select>
                  </label>
                }

                <label class="filtro-label">
                  <span>Año:</span>
                  <select
                    class="filtro-select"
                    [value]="consultorio.anioSeleccionado()"
                    (change)="onCambiarAnio($event)"
                  >
                    @for (y of aniosLista; track y) {
                      <option [value]="y" [selected]="y === consultorio.anioSeleccionado()">
                        {{ y }}
                      </option>
                    }
                  </select>
                </label>
              </div>
            }

            <div class="kpi-grid" style="margin-bottom: 14px;">
              <div class="kpi-item">
                <div class="kpi-val">{{ formatearDuracion(consultorio.resumenEstadisticas().promedioSegundos) }}</div>
                <div class="kpi-lbl">Espera Promedio</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-val">{{ consultorio.resumenEstadisticas().asientoTop }}</div>
                <div class="kpi-lbl">Más Utilizada</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-val">{{ consultorio.resumenEstadisticas().totalSesiones }}</div>
                <div class="kpi-lbl">Ocupaciones Sillas</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-val">{{ consultorio.resumenEstadisticas().entradasQr }}</div>
                <div class="kpi-lbl">Entradas por QR</div>
              </div>
            </div>

            @if (consultorio.resumenEstadisticas().demoraAlta) {
              <div class="alerta-demora">
                Tiempo promedio en sala superior a 15 minutos.
              </div>
            }

            @for (st of consultorio.estadisticasAsientos(); track st.numero) {
              <div class="stat-row">
                <div class="stat-head">
                  <span>
                    Asiento #{{ st.numero }} ({{ st.hilera }})
                    @if (st.ocupadoAhora && consultorio.rangoEstadistica() === 'hoy') {
                      <span class="live-badge">EN USO</span>
                    }
                  </span>
                  <span>
                    {{ st.vecesUsado }} {{ st.vecesUsado === 1 ? 'uso' : 'usos' }} •
                    <strong>{{ formatearDuracion(st.tiempoTotalSegundos) }}</strong> ({{ st.porcentajeUso }}%)
                  </span>
                </div>
                <div class="bar-bg">
                  <div class="bar-fill" [style.width.%]="st.porcentajeUso"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- VISTA 3: AUDITORÍA -->
        @if (vistaActiva() === 'auditoria') {
          <div class="card-box">
            <div class="card-title" style="margin-bottom: 10px;">Bitácora de Eventos IoT</div>
            @if (consultorio.auditoria().length === 0) {
              <div class="empty-msg">Sin movimientos registrados aún en este turno.</div>
            }
            @for (log of consultorio.auditoria(); track log.id) {
              <div class="log-row">
                <div class="log-top">
                  <span class="log-disp">{{ log.dispositivo }}</span>
                  <span class="log-time">{{ log.fechaHora | date: 'HH:mm:ss' }}</span>
                </div>
                <div class="log-acc">{{ log.accion }}</div>
                <div class="log-user">{{ log.usuarioNombre }} ({{ log.origen }})</div>
              </div>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .sala-content {
        --background: #F9F7F4;
        --padding-start: 14px;
        --padding-end: 14px;
        --padding-top: 14px;
        --padding-bottom: 24px;
      }
      .main-container {
        max-width: 960px;
        margin: 0 auto;
      }
      .esp-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        background: #FDECEA;
        border: 1px solid #F5C6C2;
        color: #D32F2F;
        font-size: 0.72rem;
        font-weight: 700;
        margin-right: 4px;
      }
      .esp-status-pill .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #D32F2F;
      }
      .esp-status-pill.esp-online {
        background: #E8F5E9;
        border: 1px solid #C8E6C9;
        color: #2E7D32;
      }
      .esp-status-pill.esp-online .dot {
        background: #43A047;
        box-shadow: none;
      }
      .card-box {
        background: #FFFFFF;
        border: 1px solid #EFEBE9;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 2px 10px rgba(30, 30, 30, 0.03);
        margin-bottom: 14px;
      }
      .user-hero-tint {
        background: #FFFFFF;
        border: 1px solid #EFEBE9;
      }
      .card-header-flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .card-title {
        font-size: 0.94rem;
        font-weight: 800;
        color: #1E1E1E;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .reset-auto-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #FDECEA;
        border: 1px solid #F5C6C2;
        color: #D32F2F;
        font-size: 0.72rem;
        font-weight: 800;
        padding: 5px 11px;
        border-radius: 9px;
        cursor: pointer;
      }
      .top-user-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 12px;
      }
      .user-profile-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .avatar-circle {
        width: 46px;
        height: 46px;
        border-radius: 12px;
        background: #B01E53;
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.94rem;
        font-weight: 800;
        flex-shrink: 0;
      }
      .avatar-img {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        object-fit: cover;
        border: 1px solid #ead4d8;
        flex-shrink: 0;
      }
      .user-name {
        font-size: 0.96rem;
        font-weight: 800;
        color: #1E1E1E;
      }
      .badges-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }
      .role-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 6px;
        background: #F7E6EA;
        color: #B01E53;
        font-size: 0.66rem;
        font-weight: 800;
      }
      .aforo-badge {
        display: flex;
        align-items: center;
        gap: 5px;
        background: #F7E6EA;
        border: 1px solid #e5b8c6;
        color: #B01E53;
        padding: 6px 12px;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 800;
        flex-shrink: 0;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
        gap: 8px;
      }
      .kpi-item {
        background: #F7E6EA;
        border: 1px solid #EED5DC;
        border-radius: 12px;
        padding: 10px 8px;
        text-align: center;
      }
      .kpi-val {
        font-size: 1.05rem;
        font-weight: 800;
        color: #B01E53;
      }
      .kpi-lbl {
        font-size: 0.7rem;
        font-weight: 700;
        color: #6f5c60;
      }
      .periodo-bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 10px;
      }
      .p-btn {
        padding: 7px 6px;
        border-radius: 9px;
        border: 1px solid #d9b6bd;
        background: #ffffff;
        color: #6f5c60;
        font-size: 0.74rem;
        font-weight: 800;
        cursor: pointer;
      }
      .p-btn.p-sel {
        background: #B01E53;
        border-color: #B01E53;
        color: #ffffff;
      }
      .fecha-filtros-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 12px;
        padding: 8px 10px;
        background: #ffffff;
        border: 1px solid #ead4d8;
        border-radius: 10px;
      }
      .filtro-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        font-weight: 800;
        color: #6f5c60;
        flex: 1;
        min-width: 130px;
      }
      .filtro-select {
        flex: 1;
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid #d9b6bd;
        background: #ffffff;
        color: #1E1E1E;
        font-size: 0.76rem;
        font-weight: 700;
        outline: none;
      }
      .stat-row {
        margin-bottom: 10px;
      }
      .stat-head {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        font-weight: 700;
        color: #1E1E1E;
        margin-bottom: 4px;
      }
      .live-badge {
        display: inline-block;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: 6px;
        background: #e6f9ee;
        color: #167940;
        font-size: 0.64rem;
        font-weight: 800;
      }
      .alerta-demora {
        background: #fff3cd;
        border: 1px solid #ffe69c;
        color: #856404;
        padding: 8px 10px;
        border-radius: 9px;
        font-size: 0.74rem;
        font-weight: 700;
        margin-bottom: 12px;
        text-align: center;
      }
      .bar-bg {
        height: 9px;
        background: #f3e2e5;
        border-radius: 6px;
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        background: #B01E53;
        border-radius: 6px;
      }
      .empty-msg {
        font-size: 0.78rem;
        color: #7d686c;
        text-align: center;
        padding: 12px 0;
      }
      .log-row {
        padding: 8px 0;
        border-bottom: 1px solid #f2e2e5;
      }
      .log-row:last-child {
        border-bottom: none;
      }
      .log-top {
        display: flex;
        justify-content: space-between;
        font-size: 0.78rem;
        font-weight: 800;
        color: #1E1E1E;
      }
      .log-time {
        font-size: 0.7rem;
        font-weight: 700;
        color: #B01E53;
      }
      .log-acc {
        font-size: 0.74rem;
        color: #1E1E1E;
        margin-top: 2px;
      }
      .log-user {
        font-size: 0.68rem;
        font-weight: 600;
        color: #6f5c60;
        margin-top: 2px;
      }
    `,
  ],
})
export class SalaPage implements OnInit {
  auth = inject(AuthService);
  consultorio = inject(ConsultorioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  vistaActiva = signal<'plano' | 'stats' | 'auditoria'>('plano');
  fotoError = signal<boolean>(false);

  readonly mesesLista = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' },
  ];

  readonly aniosLista: number[] = (() => {
    const actual = new Date().getFullYear();
    return [actual, actual - 1, actual - 2, actual - 3];
  })();

  ventiladoresActivos = computed(
    () => this.consultorio.ventiladores().filter((v) => v.encendido).length
  );

  hayAlgoEncendido = computed(
    () => this.consultorio.luces().encendido || this.ventiladoresActivos() > 0
  );

  fotoPerfilUrl = computed(() => {
    const foto = (this.auth.usuarioActual() as any)?.foto_perfil;
    if (!foto || typeof foto !== 'string') return '';
    const limpio = foto.trim();
    if (!limpio || limpio.startsWith('profile-photos/')) return '';
    if (limpio.startsWith('http://') || limpio.startsWith('https://') || limpio.startsWith('data:')) {
      return limpio;
    }
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    const ruta = limpio.startsWith('/') ? limpio : `/storage/${limpio.replace(/^storage\//, '')}`;
    return `${base}${ruta}`;
  });

  inicialesUsuario = computed(() => {
    const nombre = this.auth.usuarioActual()?.nombre || 'ML';
    const partes = nombre.trim().split(/\s+/);
    return partes
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');
  });

  etiquetaRol = computed(() => {
    const u = this.auth.usuarioActual();
    if (u?.rol_etiqueta) return u.rol_etiqueta;
    if (u?.rol === 'super_admin') return 'Doctora titular';
    if (u?.rol === 'doctor') return 'Doctor';
    if (u?.rol === 'asistente') return 'Asistente';
    return 'Personal Autorizado';
  });

  constructor() {
    addIcons({
      logOutOutline,
      peopleOutline,
      powerOutline,
      barChartOutline,
      downloadOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      if (data['vista']) {
        this.vistaActiva.set(data['vista']);
      }
    });
  }

  seleccionarPeriodo(rango: RangoEstadistica): void {
    this.consultorio.cambiarRangoEstadisticas(rango);
  }

  onCambiarMes(ev: Event): void {
    const mes = Number((ev.target as HTMLSelectElement).value);
    this.consultorio.cambiarMesAnioEstadisticas(mes, this.consultorio.anioSeleccionado());
  }

  onCambiarAnio(ev: Event): void {
    const anio = Number((ev.target as HTMLSelectElement).value);
    this.consultorio.cambiarMesAnioEstadisticas(this.consultorio.mesSeleccionado(), anio);
  }

  etiquetaPeriodo(): string {
    const r = this.consultorio.rangoEstadistica();
    const anio = this.consultorio.anioSeleccionado();
    if (r === 'semana') return 'Últimos 7 días';
    if (r === 'mes') {
      const m = this.mesesLista.find((x) => x.valor === this.consultorio.mesSeleccionado())?.nombre || '';
      return `${m} ${anio}`;
    }
    if (r === 'anio') return `Año ${anio}`;
    return 'Hoy';
  }

  formatearDuracion(segundos: number): string {
    if (!segundos || segundos <= 0) return '0s';
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    if (mins === 0) return `${segs}s`;
    return `${mins}m ${segs}s`;
  }

  exportarEstadisticasCsv(): void {
    const r = this.consultorio.rangoEstadistica();
    const sufijo =
      r === 'mes'
        ? `mes-${this.consultorio.mesSeleccionado()}-${this.consultorio.anioSeleccionado()}`
        : r === 'anio'
          ? `anio-${this.consultorio.anioSeleccionado()}`
          : `${r}-${new Date().toISOString().slice(0, 10)}`;

    const filas = [
      ['Asiento', 'Hilera', 'Veces Usado', 'Tiempo Total (seg)', 'Porcentaje Uso (%)'],
      ...this.consultorio.estadisticasAsientos().map((s) => [
        `Silla #${s.numero}`,
        s.hilera,
        s.vecesUsado,
        s.tiempoTotalSegundos,
        `${s.porcentajeUso}%`,
      ]),
    ];
    const csv = filas.map((f) => f.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estadisticas-${sufijo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  salir(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}