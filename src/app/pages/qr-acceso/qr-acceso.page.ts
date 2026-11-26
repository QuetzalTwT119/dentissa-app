import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Html5Qrcode } from 'html5-qrcode';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  qrCodeOutline,
  stopCircleOutline,
  timeOutline,
} from 'ionicons/icons';
import * as QRCode from 'qrcode';
import { AuthService } from '../../core/services/auth.service';
import { ConsultorioService } from '../../core/services/consultorio.service';

@Component({
  selector: 'app-qr-acceso',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background: #B01E53; --color: #FFFFFF;">
        <ion-title>Acceso QR • Puerta Principal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="qr-content">
      <div class="segment-wrap">
        <ion-segment mode="ios" [value]="vistaActiva()" (ionChange)="cambiarVista($event)">
          <ion-segment-button value="mi-qr">
            <ion-icon name="qr-code-outline"></ion-icon>
            <ion-label>Mi QR de Acceso</ion-label>
          </ion-segment-button>
          <ion-segment-button value="escaner">
            <ion-icon name="camera-outline"></ion-icon>
            <ion-label>Cámara Puerta</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
      <div class="scanner-wrapper">
        @if (vistaActiva() === 'credencial') {
          <div class="scanner-card">
            <div class="card-title">Credencial QR Dinámica</div>
            <p class="card-sub">
              Presenta este código ante el lector del consultorio. Se renueva automáticamente cada minuto.
            </p>

            <div class="qr-dynamic-box">
              @if (qrDataUrl()) {
                <img [src]="qrDataUrl()" alt="Código QR dinámico de acceso" class="qr-image" />
              }
            </div>

            <div class="user-pill">
              <strong>{{ auth.usuarioActual()?.nombre || 'Personal Dentissa' }}</strong>
              <span>{{ etiquetaRol() }}</span>
            </div>

            <div class="countdown-box">
              <div class="countdown-header">
                <span class="countdown-label">
                  <ion-icon name="time-outline"></ion-icon>
                  Renovación automática en
                </span>
                <span class="countdown-seconds">{{ segundosRestantes() }}s</span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  [style.width.%]="(segundosRestantes() / 60) * 100"
                ></div>
              </div>
            </div>
          </div>
        } @else {
          <div class="scanner-card">
            <div class="card-title">Escáner de Entrada</div>
            <p class="card-sub">
              Apunta el código QR de la cita o credencial a la cámara para validar y abrir la puerta.
            </p>

            <div class="camera-frame">
              <div id="qr-reader" class="qr-reader-box"></div>
              @if (!escaneando()) {
                <div class="camera-placeholder">
                  <ion-icon name="camera-outline"></ion-icon>
                  <span>Cámara en espera</span>
                </div>
              }
            </div>

            @if (estadoMensaje()) {
              <div
                class="status-banner"
                [class.status-ok]="estadoTipo() === 'ok'"
                [class.status-err]="estadoTipo() === 'err'"
              >
                <ion-icon
                  [name]="estadoTipo() === 'ok' ? 'checkmark-circle-outline' : 'close-circle-outline'"
                ></ion-icon>
                <span>{{ estadoMensaje() }}</span>
              </div>
            }

            @if (!escaneando()) {
              <ion-button expand="block" color="primary" class="cam-btn" style="--background: #B01E53; --background-activated: #8d2045; --color: #ffffff;" (click)="iniciarCamara()">
                <ion-icon slot="start" name="camera-outline"></ion-icon>
                ACTIVAR CÁMARA QR
              </ion-button>
            } @else {
              <ion-button expand="block" color="medium" fill="outline" class="cam-btn" style="--background: #B01E53; --background-activated: #8d2045; --color: #ffffff;" (click)="detenerCamara()">
                <ion-icon slot="start" name="stop-circle-outline"></ion-icon>
                DETENER CÁMARA
              </ion-button>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .segment-toolbar {
        --background: #FFFFFF;
        padding: 8px 16px 10px;
        border-bottom: 1px solid #e7ccd2;
      }
      ion-segment {
        --background: #F7E6EA;
        border: 1px solid #f1dce1;
        border-radius: 999px;
        padding: 3px;
        max-width: 520px;
        margin: 0 auto;
      }
      ion-segment-button {
        --indicator-color: #B01E53;
        --border-radius: 999px;
        --color: #6f5c60;
        --color-checked: #ffffff;
        font-weight: 700;
        font-size: 0.8rem;
        min-height: 36px;
        text-transform: none;
        letter-spacing: 0;
      }
      ion-segment-button.segment-button-checked {
        color: #ffffff !important;
      }
      .qr-content {
        --background: #F9F7F4;
        --padding-start: 14px;
        --padding-end: 14px;
        --padding-top: 16px;
        --padding-bottom: 24px;
      }
      .scanner-wrapper {
        max-width: 520px;
        margin: 0 auto;
      }
      .scanner-card {
        background: #ffffff;
        border: 1px solid #f1e2e5;
        border-radius: 16px;
        padding: 18px;
        box-shadow: 0 4px 14px rgba(168, 50, 86, 0.06);
        text-align: center;
      }
      .card-title {
        font-size: 1.05rem;
        font-weight: 800;
        color: #22181a;
      }
      .card-sub {
        font-size: 0.78rem;
        color: #6f5c60;
        margin: 6px 0 14px;
      }
      .qr-dynamic-box {
        width: 240px;
        height: 240px;
        margin: 0 auto 14px;
        padding: 12px;
        border-radius: 16px;
        background: #ffffff;
        border: 2px solid #f1e2e5;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .user-pill {
        display: inline-flex;
        flex-direction: column;
        gap: 2px;
        background: #fdf7f6;
        border: 1px solid #f1e2e5;
        border-radius: 12px;
        padding: 8px 16px;
        margin-bottom: 14px;
        font-size: 0.82rem;
        color: #22181a;
      }
      .user-pill span {
        font-size: 0.72rem;
        font-weight: 700;
        color: #B01E53;
      }
      .countdown-box {
        background: #fdf7f6;
        border: 1px solid #f1e2e5;
        border-radius: 12px;
        padding: 10px 14px;
      }
      .countdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.78rem;
        margin-bottom: 6px;
      }
      .countdown-label {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #6f5c60;
        font-weight: 600;
      }
      .countdown-seconds {
        font-weight: 800;
        color: #B01E53;
        font-variant-numeric: tabular-nums;
      }
      .progress-track {
        width: 100%;
        height: 6px;
        background: #f1e2e5;
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: #B01E53;
        transition: width 0.35s linear;
      }
      .camera-frame {
        position: relative;
        width: 100%;
        min-height: 270px;
        border-radius: 14px;
        overflow: hidden;
        background: #1c1618;
        border: 2px solid #f1e2e5;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr-reader-box {
        width: 100%;
      }
      .camera-placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #d9b6bd;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .camera-placeholder ion-icon {
        font-size: 2.6rem;
        color: #B01E53;
      }
      .status-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 800;
        margin-bottom: 12px;
      }
      .status-ok {
        background: #e6f9ee;
        border: 1px solid #a3e4bf;
        color: #167940;
      }
      .status-err {
        background: #fde8ec;
        border: 1px solid #f5b7c3;
        color: #9e1c38;
      }
      .cam-btn {
        --border-radius: 12px;
        font-weight: 800;
        height: 46px;
      }
    `,
  ],
})
export class QrAccesoPage implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly etiquetaRol = computed(() => {
    const u = this.auth.usuarioActual();
    if (u?.rol_etiqueta) return u.rol_etiqueta;
    if (u?.rol === 'super_admin') return 'Doctora titular';
    if (u?.rol === 'doctor') return 'Doctor';
    return 'Asistente';
  });
  private consultorio = inject(ConsultorioService);
  private html5Qr: Html5Qrcode | null = null;
  private procesando = false;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private ultimoMinutoGenerado = -1;

  vistaActiva = signal<'credencial' | 'escaner'>('credencial');
  qrDataUrl = signal<string>('');
  segundosRestantes = signal<number>(60);

  escaneando = signal(false);
  estadoMensaje = signal('');
  estadoTipo = signal<'ok' | 'err' | ''>('');

  constructor() {
    addIcons({
      qrCodeOutline,
      cameraOutline,
      stopCircleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    this.actualizarCicloQr();
    this.timerInterval = setInterval(() => {
      this.actualizarCicloQr();
    }, 1000);
  }

  private async actualizarCicloQr(): Promise<void> {
    const ahoraSeg = Math.floor(Date.now() / 1000);
    const minutoActual = Math.floor(ahoraSeg / 60);
    const restantes = 60 - (ahoraSeg % 60);
    this.segundosRestantes.set(restantes);

    if (minutoActual !== this.ultimoMinutoGenerado) {
      this.ultimoMinutoGenerado = minutoActual;
      await this.generarQrDinamico(minutoActual);
    }
  }

  private async generarQrDinamico(ventanaMinuto: number): Promise<void> {
    const user = this.auth.usuarioActual();
    const uid = Number(user?.id) || 0;
    const rol = (user?.rol ?? 'staff').toUpperCase();
    const firma = ((uid * 7919 + ventanaMinuto * 104729) >>> 0).toString(16).toUpperCase().padStart(8, '0');
    const payload = `DENTISSA-STAFF:${uid}:${rol}:${ventanaMinuto}:${firma}`;

    try {
      const url = await QRCode.toDataURL(payload, {
        width: 260,
        margin: 1,
        color: {
          dark: '#22181a',
          light: '#ffffff',
        },
      });
      this.qrDataUrl.set(url);
    } catch {}
  }

  async cambiarVista(event: CustomEvent): Promise<void> {
    const nuevaVista = event.detail?.value as 'credencial' | 'escaner';
    if (!nuevaVista || nuevaVista === this.vistaActiva()) return;

    if (nuevaVista === 'credencial' && this.escaneando()) {
      await this.detenerCamara();
    }
    this.vistaActiva.set(nuevaVista);
  }

  async iniciarCamara(): Promise<void> {
    this.estadoMensaje.set('');
    this.estadoTipo.set('');

    try {
      this.html5Qr = new Html5Qrcode('qr-reader');
      this.escaneando.set(true);

      await this.html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (textoLeido) => {
          if (this.procesando) return;
          this.procesando = true;

          const resultado = await this.consultorio.validarYAbrirPuertaQr(textoLeido);
          this.estadoTipo.set(resultado.ok ? 'ok' : 'err');
          this.estadoMensaje.set(resultado.mensaje);

          setTimeout(() => {
            this.procesando = false;
          }, 3000);
        },
        () => {}
      );
    } catch {
      this.escaneando.set(false);
      this.estadoTipo.set('err');
      this.estadoMensaje.set('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  }

  async detenerCamara(): Promise<void> {
    if (this.html5Qr && this.escaneando()) {
      try {
        await this.html5Qr.stop();
        this.html5Qr.clear();
      } catch {}
    }
    this.escaneando.set(false);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.detenerCamara();
  }
}