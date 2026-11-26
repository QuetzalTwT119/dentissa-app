import { UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
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
  bulb,
  bulbOutline,
  lockClosedOutline,
  lockOpenOutline,
  logOutOutline,
  peopleOutline,
} from 'ionicons/icons';
import { MapaAsientosComponent } from '../../components/mapa-asientos/mapa-asientos.component';
import { AuthService } from '../../core/services/auth.service';
import { ConsultorioService } from '../../core/services/consultorio.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    UpperCasePipe,
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
      <ion-toolbar color="primary">
        <ion-title>Dentissa • Monitor</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="salir()">
            <ion-icon slot="start" name="log-out-outline"></ion-icon>
            {{ auth.usuarioActual()?.rol | uppercase }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content">
      <!-- RESUMEN COMPACTO DE 3 INDICADORES EN UNA FILA -->
      <div class="kpi-strip">
        <!-- 1. Aforo calculado por asientos ocupados -->
        <div class="kpi-pill">
          <div class="kpi-icon-wrap kpi-primary">
            <ion-icon name="people-outline"></ion-icon>
          </div>
          <div class="kpi-dato">
            {{ consultorio.telemetria().aforoActual }}/{{ consultorio.telemetria().capacidadMaxima }}
          </div>
          <div class="kpi-titulo">Aforo Sala</div>
        </div>

        <!-- 2. Estado de puerta -->
        <div class="kpi-pill">
          <div
            class="kpi-icon-wrap"
            [class.kpi-success]="consultorio.telemetria().puertaAbierta"
            [class.kpi-neutral]="!consultorio.telemetria().puertaAbierta"
          >
            <ion-icon
              [name]="consultorio.telemetria().puertaAbierta ? 'lock-open-outline' : 'lock-closed-outline'"
            ></ion-icon>
          </div>
          <div class="kpi-dato">
            {{ consultorio.telemetria().puertaAbierta ? 'Abierta' : 'Cerrada' }}
          </div>
          <div class="kpi-titulo">Puerta</div>
        </div>

        <!-- 3. Estado y control rápido de Tira LED -->
        <div
          class="kpi-pill kpi-clickable"
          [class.kpi-led-active]="consultorio.telemetria().luces.encendido"
          (click)="consultorio.toggleLuces()"
        >
          <div
            class="kpi-icon-wrap"
            [class.kpi-warning]="consultorio.telemetria().luces.encendido"
            [class.kpi-neutral]="!consultorio.telemetria().luces.encendido"
          >
            <ion-icon
              [name]="consultorio.telemetria().luces.encendido ? 'bulb' : 'bulb-outline'"
            ></ion-icon>
          </div>
          <div class="kpi-dato">
            {{ consultorio.telemetria().luces.encendido ? 'Encendida' : 'Apagada' }}
          </div>
          <div class="kpi-titulo kpi-accion-led">
            {{ consultorio.telemetria().luces.encendido ? 'Tocar: Apagar' : 'Enciende con QR' }}
          </div>
        </div>
      </div>

      <!-- MAPA DE LOS 6 ASIENTOS Y 4 VENTILADORES -->
      <app-mapa-asientos
        [asientos]="consultorio.telemetria().asientos"
        [ventiladores]="consultorio.telemetria().ventiladores"
        (asientoClick)="consultorio.toggleSimularAsiento($event)"
      ></app-mapa-asientos>
    </ion-content>
  `,
  styles: [
    `
      .dashboard-content {
        --background: #f4f6fa;
        --padding-start: 12px;
        --padding-end: 12px;
        --padding-top: 12px;
        --padding-bottom: 16px;
      }
      .kpi-strip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 10px;
      }
      .kpi-pill {
        background: #ffffff;
        border-radius: 14px;
        padding: 10px 6px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 1.5px solid transparent;
        transition: transform 0.12s ease, border-color 0.2s ease, background 0.2s ease;
      }
      .kpi-clickable {
        cursor: pointer;
      }
      .kpi-clickable:active {
        transform: scale(0.96);
      }
      .kpi-led-active {
        border-color: rgba(255, 196, 9, 0.75);
        background: #fffdf5;
      }
      .kpi-icon-wrap {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        margin-bottom: 6px;
      }
      .kpi-primary {
        background: rgba(56, 128, 255, 0.14);
        color: var(--ion-color-primary);
      }
      .kpi-success {
        background: rgba(45, 211, 111, 0.16);
        color: var(--ion-color-success-shade);
      }
      .kpi-warning {
        background: rgba(255, 196, 9, 0.24);
        color: #b58100;
      }
      .kpi-neutral {
        background: rgba(146, 148, 156, 0.15);
        color: var(--ion-color-medium-shade);
      }
      .kpi-dato {
        font-size: 0.95rem;
        font-weight: 800;
        color: var(--ion-color-dark);
        line-height: 1.1;
      }
      .kpi-titulo {
        font-size: 0.68rem;
        font-weight: 600;
        color: var(--ion-color-medium);
        margin-top: 3px;
      }
      .kpi-led-active .kpi-accion-led {
        color: #b58100;
        font-weight: 700;
      }
    `,
  ],
})
export class DashboardPage {
  consultorio = inject(ConsultorioService);
  auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({
      logOutOutline,
      peopleOutline,
      lockOpenOutline,
      lockClosedOutline,
      bulb,
      bulbOutline,
    });
  }

  salir(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
