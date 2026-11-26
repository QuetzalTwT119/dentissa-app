import { Component, input, output } from '@angular/core';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bulbOutline, snowOutline } from 'ionicons/icons';
import { EstadoActuador, ModoControl } from '../../models/consultorio.model';

@Component({
  selector: 'app-control-actuador',
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: `
    <ion-card>
      <ion-card-header>
        <div class="header-row">
          <div class="titulo-grupo">
            <ion-icon
              [name]="actuador().id === 'LUCES' ? 'bulb-outline' : 'snow-outline'"
              [color]="actuador().encendido ? 'primary' : 'medium'"
              class="icono-disp"
            ></ion-icon>
            <div>
              <ion-card-title>{{ actuador().nombre }}</ion-card-title>
              <ion-card-subtitle>{{ actuador().zonaDescripcion }}</ion-card-subtitle>
            </div>
          </div>

          <ion-badge [color]="actuador().encendido ? 'success' : 'medium'">
            {{ actuador().encendido ? 'ENCENDIDO' : 'APAGADO' }}
          </ion-badge>
        </div>
      </ion-card-header>

      <ion-card-content>
        <ion-segment
          [value]="actuador().modo"
          (ionChange)="onSegmentChange($event)"
        >
          <ion-segment-button value="AUTO">
            <ion-label>Auto</ion-label>
          </ion-segment-button>
          <ion-segment-button value="MANUAL_ON">
            <ion-label>ON</ion-label>
          </ion-segment-button>
          <ion-segment-button value="MANUAL_OFF">
            <ion-label>OFF</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .titulo-grupo {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .icono-disp {
        font-size: 1.6rem;
      }
      ion-card-title {
        font-size: 1rem;
      }
    `,
  ],
})
export class ControlActuadorComponent {
  actuador = input.required<EstadoActuador>();
  modoChange = output<ModoControl>();

  constructor() {
    addIcons({ bulbOutline, snowOutline });
  }

  onSegmentChange(event: CustomEvent): void {
    const valor = event.detail.value as ModoControl;
    if (valor) {
      this.modoChange.emit(valor);
    }
  }
}
