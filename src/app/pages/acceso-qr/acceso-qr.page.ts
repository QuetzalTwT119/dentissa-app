import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  keyOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from 'ionicons/icons';
import * as QRCode from 'qrcode';
import { AuthService } from '../../core/services/auth.service';
import { CitasQrService } from '../../core/services/citas-qr.service';
import { TotpService } from '../../core/services/totp.service';
import { UsuarioSesion } from '../../models/consultorio.model';

@Component({
  selector: 'app-acceso-qr',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonList,
    IonBadge,
    IonProgressBar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Acceso Puerta (QR TOTP)</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-segment [(ngModel)]="modoVista" class="ion-margin-bottom">
        <ion-segment-button value="mi-qr">
          <ion-label>Mi QR Dinámico</ion-label>
        </ion-segment-button>
        <ion-segment-button value="escaner">
          <ion-label>Escanear Puerta</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- MODO 1: CREDENCIAL QR DINÁMICA TOTP (SE RENUEVA CADA 30S) -->
      @if (modoVista === 'mi-qr') {
        <ion-card class="ion-text-center">
          <ion-card-header>
            <ion-card-title>Credencial Dinámica TOTP</ion-card-title>
            <ion-card-subtitle>
              Se renueva automáticamente cada 30 segundos por seguridad
            </ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            @if (qrImagenUrl()) {
              <div class="qr-wrapper">
                <img [src]="qrImagenUrl()" alt="QR Dinámico TOTP" class="qr-img" />
              </div>
            }

            <div class="otp-display">
              <ion-icon name="shield-checkmark-outline" color="primary"></ion-icon>
              <span>{{ codigoOtpActual() }}</span>
            </div>

            <div class="timer-box">
              <div class="timer-texto">
                <ion-icon name="time-outline"></ion-icon>
                <span>Expira en <strong>{{ segundosRestantes() }}s</strong></span>
              </div>
              <ion-progress-bar
                [value]="segundosRestantes() / 30"
                [color]="segundosRestantes() <= 6 ? 'danger' : 'primary'"
              ></ion-progress-bar>
            </div>

            <h2 class="ion-margin-top">{{ auth.usuarioActual()?.nombre }}</h2>
            <ion-badge color="medium">{{ payloadQrActual() }}</ion-badge>
          </ion-card-content>
        </ion-card>
      }

      <!-- MODO 2: LECTOR Y VALIDACIÓN DE PUERTA -->
      @if (modoVista === 'escaner') {
        <ion-card>
          <ion-card-header>
            <ion-card-title>Validar QR de Acceso</ion-card-title>
            <ion-card-subtitle>
              Verifica el token TOTP vigente antes de accionar el servo
            </ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <ion-button
              expand="block"
              color="primary"
              class="ion-margin-bottom"
              (click)="escanearConCamara()"
            >
              <ion-icon slot="start" name="camera-outline"></ion-icon>
              Escanear con Cámara
            </ion-button>

            <ion-item fill="outline" class="ion-margin-bottom">
              <ion-input
                label="Token QR (DENTISSA:ID:OTP)"
                labelPlacement="floating"
                [(ngModel)]="codigoManual"
              ></ion-input>
            </ion-item>

            <ion-button
              expand="block"
              color="success"
              (click)="activarPuertaConQr(codigoManual)"
            >
              <ion-icon slot="start" name="key-outline"></ion-icon>
              Validar Token y Abrir Puerta
            </ion-button>

            @if (resultadoValidacion(); as res) {
              <div
                class="alerta-resultado"
                [class.exito]="res.valido"
                [class.error]="!res.valido"
              >
                <ion-icon
                  [name]="res.valido ? 'checkmark-circle-outline' : 'close-circle-outline'"
                ></ion-icon>
                <span>{{ res.mensaje }}</span>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Simular Escaneo de Personal</ion-card-title>
            <ion-card-subtitle>
              Genera y escanea al instante el QR TOTP vigente de un empleado
            </ion-card-subtitle>
          </ion-card-header>
          <ion-list>
            @for (usr of auth.obtenerPersonalActivo(); track usr.id) {
              <ion-item button (click)="simularEscaneoEmpleado(usr)">
                <ion-label>
                  <h2>{{ usr.nombre }}</h2>
                  <p>ID: {{ usr.id }} • Secreto TOTP asignado</p>
                </ion-label>
                <ion-badge slot="end" color="primary">
                  {{ usr.rol }}
                </ion-badge>
              </ion-item>
            }
          </ion-list>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [
    `
      .qr-img {
        width: 220px;
        height: 220px;
        margin: 8px auto;
        border: 4px solid var(--ion-color-primary);
        border-radius: 14px;
      }
      .otp-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 1.7rem;
        font-weight: 800;
        letter-spacing: 4px;
        margin: 8px 0;
        color: var(--ion-color-dark);
      }
      .timer-box {
        max-width: 240px;
        margin: 0 auto 12px;
      }
      .timer-texto {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 0.9rem;
        margin-bottom: 6px;
        color: var(--ion-color-medium-shade);
      }
      .alerta-resultado {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 16px;
        padding: 12px;
        border-radius: 10px;
        font-weight: 600;
      }
      .alerta-resultado.exito {
        background: rgba(45, 211, 111, 0.15);
        color: var(--ion-color-success-shade);
      }
      .alerta-resultado.error {
        background: rgba(235, 68, 90, 0.15);
        color: var(--ion-color-danger-shade);
      }
      .alerta-resultado ion-icon {
        font-size: 1.6rem;
        flex-shrink: 0;
      }
    `,
  ],
})
export class AccesoQrPage implements OnInit, OnDestroy {
  qrService = inject(CitasQrService);
  auth = inject(AuthService);
  totp = inject(TotpService);

  modoVista: 'mi-qr' | 'escaner' = 'mi-qr';
  codigoManual = '';

  qrImagenUrl = signal<string>('');
  codigoOtpActual = signal<string>('------');
  payloadQrActual = signal<string>('');
  segundosRestantes = signal<number>(30);
  resultadoValidacion = signal<{ valido: boolean; mensaje: string } | null>(null);

  private intervaloTimer: ReturnType<typeof setInterval> | null = null;
  private ultimaVentanaGenerada = -1;

  constructor() {
    addIcons({
      cameraOutline,
      keyOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      shieldCheckmarkOutline,
      timeOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.actualizarCicloTotp(true);
    this.intervaloTimer = setInterval(() => {
      void this.actualizarCicloTotp(false);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervaloTimer) {
      clearInterval(this.intervaloTimer);
    }
  }

  private async actualizarCicloTotp(forzar: boolean): Promise<void> {
    const restantes = this.totp.obtenerSegundosRestantes();
    this.segundosRestantes.set(restantes);

    const ventanaActual = Math.floor(Date.now() / 1000 / this.totp.PERIODO_SEGUNDOS);
    if (!forzar && ventanaActual === this.ultimaVentanaGenerada) {
      return;
    }

    this.ultimaVentanaGenerada = ventanaActual;
    const user = this.auth.usuarioActual();
    if (!user) return;

    const { payload, codigoOtp } = await this.totp.generarPayloadQr(
      user.id,
      user.totpSecret
    );

    this.codigoOtpActual.set(codigoOtp);
    this.payloadQrActual.set(payload);
    this.codigoManual = payload;

    const url = await QRCode.toDataURL(payload, { width: 250, margin: 1 });
    this.qrImagenUrl.set(url);
  }

  async escanearConCamara(): Promise<void> {
    try {
      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        this.codigoManual = barcodes[0].rawValue;
        await this.activarPuertaConQr(this.codigoManual);
      }
    } catch {
      this.resultadoValidacion.set({
        valido: false,
        mensaje:
          'Cámara nativa no disponible en navegador web. Usa el campo o la lista inferior.',
      });
    }
  }

  async simularEscaneoEmpleado(usuario: UsuarioSesion): Promise<void> {
    const { payload } = await this.totp.generarPayloadQr(
      usuario.id,
      usuario.totpSecret
    );
    this.codigoManual = payload;
    await this.activarPuertaConQr(payload);
  }

  async activarPuertaConQr(codigo: string): Promise<void> {
    if (!codigo.trim()) return;
    const res = await this.qrService.validarQrPuerta(codigo);
    this.resultadoValidacion.set({
      valido: res.valido,
      mensaje: res.mensaje,
    });
  }
}
