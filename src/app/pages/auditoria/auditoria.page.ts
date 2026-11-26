import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import { ConsultorioService } from '../../core/services/consultorio.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonNote,
    IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Auditoría y Eventos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Bitácora de Operaciones</ion-card-title>
          <ion-card-subtitle>
            Registro de accesos QR, cambios manuales y reinicios ({{ consultorio.auditoria().length }} eventos)
          </ion-card-subtitle>
        </ion-card-header>

        <ion-list>
          @for (log of consultorio.auditoria(); track log.id) {
            <ion-item>
              <ion-icon slot="start" name="time-outline" color="primary"></ion-icon>
              <ion-label>
                <h2>{{ log.accion }}</h2>
                <p>Por: <strong>{{ log.usuarioNombre }}</strong></p>
                <ion-badge color="light">{{ log.dispositivo }}</ion-badge>
              </ion-label>
              <ion-note slot="end">
                {{ log.fechaHora | date: 'shortTime' }}
              </ion-note>
            </ion-item>
          }
        </ion-list>
      </ion-card>
    </ion-content>
  `,
})
export class AuditoriaPage {
  consultorio = inject(ConsultorioService);

  constructor() {
    addIcons({ timeOutline });
  }
}
