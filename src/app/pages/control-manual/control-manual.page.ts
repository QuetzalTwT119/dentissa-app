import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItemDivider,
  IonLabel,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockOpenOutline, refreshOutline, syncOutline } from 'ionicons/icons';
import { ControlActuadorComponent } from '../../components/control-actuador/control-actuador.component';
import { AuthService } from '../../core/services/auth.service';
import { ConsultorioService } from '../../core/services/consultorio.service';

@Component({
  selector: 'app-control-manual',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItemDivider,
    IonLabel,
    ControlActuadorComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-title>Control Manual</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="control-content">
      <!-- ACCESO Y TURNO EN FILA COMPACTA -->
      <ion-card class="compact-card">
        <ion-card-header>
          <ion-card-title>Acceso y Turno</ion-card-title>
          <ion-card-subtitle>Operador: {{ auth.usuarioActual()?.nombre || 'Recepción' }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button
            expand="block"
            color="success"
            class="ion-margin-bottom"
            (click)="consultorio.abrirPuertaPorQr(auth.usuarioActual()?.nombre || 'Recepción', 'PERSONAL', 'MANUAL_APP')"
          >
            <ion-icon slot="start" name="lock-open-outline"></ion-icon>
            Abrir Puerta Principal (Servo 4s)
          </ion-button>

          <div class="acciones-grid">
            <ion-button size="small" color="primary" (click)="consultorio.restablecerTodoAuto()">
              <ion-icon slot="start" name="sync-outline"></ion-icon>
              Todo a AUTO
            </ion-button>

            <ion-button size="small" fill="outline" color="danger" (click)="consultorio.reiniciarAforo()">
              <ion-icon slot="start" name="refresh-outline"></ion-icon>
              Aforo a 0
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-item-divider>
        <ion-label>Iluminación Principal</ion-label>
      </ion-item-divider>

      <app-control-actuador
        [actuador]="consultorio.telemetria().luces"
        (modoChange)="consultorio.cambiarModoActuador('LUCES', $event)"
      ></app-control-actuador>

      <ion-item-divider>
        <ion-label>Ventilación por Zonas (4 Motores)</ion-label>
      </ion-item-divider>

      <!-- CUADRÍCULA 2x2 PARA LOS 4 VENTILADORES -->
      <div class="ventiladores-grid">
        @for (vent of consultorio.telemetria().ventiladores; track vent.id) {
          <app-control-actuador
            [actuador]="vent"
            (modoChange)="consultorio.cambiarModoActuador(vent.id, $event)"
          ></app-control-actuador>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .control-content {
        --background: #f4f6fa;
        --padding-start: 12px;
        --padding-end: 12px;
        --padding-top: 10px;
        --padding-bottom: 20px;
      }
      .compact-card {
        margin: 0 0 10px 0;
        border-radius: 14px;
      }
      .acciones-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .ventiladores-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
    `,
  ],
})
export class ControlManualPage {
  consultorio = inject(ConsultorioService);
  auth = inject(AuthService);

  constructor() {
    addIcons({ syncOutline, refreshOutline, lockOpenOutline });
  }
}
