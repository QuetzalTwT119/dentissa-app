import { Component, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bulb,
  bulbOutline,
  lockClosedOutline,
  lockOpenOutline,
  person,
  personOutline,
  syncCircle,
  syncCircleOutline,
} from 'ionicons/icons';
import { ConsultorioService } from '../../core/services/consultorio.service';
import { DispositivoId } from '../../models/consultorio.model';

@Component({
  selector: 'app-mapa-asientos',
  standalone: true,
  imports: [IonIcon],
  template: `
    <div class="consultorio-plano">
      <!-- BARRA SUPERIOR DEL PLANO: LEDS Y PUERTA -->
      <div class="top-infra-bar">
        <button
          type="button"
          class="infra-chip"
          [class.led-on]="consultorio.luces().encendido"
          (click)="tocarActuador('LUCES')"
        >
          <ion-icon [name]="consultorio.luces().encendido ? 'bulb' : 'bulb-outline'"></ion-icon>
          <span>
            Leds: <strong>{{ consultorio.luces().encendido ? 'ON' : 'OFF' }}</strong>
          </span>
        </button>

        <button
          type="button"
          class="infra-chip"
          [class.puerta-abierta]="consultorio.puertaAbierta()"
          (click)="tocarPuerta()"
        >
          <ion-icon [name]="consultorio.puertaAbierta() ? 'lock-open-outline' : 'lock-closed-outline'"></ion-icon>
          <span>Puerta: <strong>{{ consultorio.puertaAbierta() ? 'ABIERTA' : 'CERRADA' }}</strong></span>
        </button>
      </div>

      <!-- DISTRIBUCIÓN DE LA SALA -->
      <div class="sala-grid">
        <!-- HILERA IZQUIERDA -->
        <div class="hilera-col">
          <div class="hilera-label">Hilera Izquierda</div>

          <button
            type="button"
            class="fan-btn"
            [class.fan-on]="consultorio.ventiladores()[0]?.encendido"
            (click)="tocarActuador('VENTILADOR_1')"
          >
            <ion-icon
              [name]="consultorio.ventiladores()[0]?.encendido ? 'sync-circle' : 'sync-circle-outline'"
              [class.spin]="consultorio.ventiladores()[0]?.encendido"
            ></ion-icon>
            <span>V1 • {{ consultorio.ventiladores()[0]?.encendido ? 'ON' : 'OFF' }}</span>
          </button>

          @for (asiento of asientosIzquierda(); track asiento.numero) {
            <div class="seat-card" [class.seat-occupied]="asiento.ocupado">
              <ion-icon [name]="asiento.ocupado ? 'person' : 'person-outline'"></ion-icon>
              <div class="seat-text">
                <strong>Silla #{{ asiento.numero }}</strong>
                <span>{{ asiento.ocupado ? 'Ocupada (IR)' : 'Disponible' }}</span>
              </div>
            </div>
          }

          <button
            type="button"
            class="fan-btn"
            [class.fan-on]="consultorio.ventiladores()[1]?.encendido"
            (click)="tocarActuador('VENTILADOR_2')"
          >
            <ion-icon
              [name]="consultorio.ventiladores()[1]?.encendido ? 'sync-circle' : 'sync-circle-outline'"
              [class.spin]="consultorio.ventiladores()[1]?.encendido"
            ></ion-icon>
            <span>V2 • {{ consultorio.ventiladores()[1]?.encendido ? 'ON' : 'OFF' }}</span>
          </button>
        </div>

        <!-- PASILLO CENTRAL -->
        <div class="pasillo-col">
          <div class="puerta-tag">ACCESO</div>
          <div class="pasillo-line"></div>
          <div class="pasillo-text">PASILLO</div>
          <div class="pasillo-line"></div>
        </div>

        <!-- HILERA DERECHA -->
        <div class="hilera-col">
          <div class="hilera-label">Hilera Derecha</div>

          <button
            type="button"
            class="fan-btn"
            [class.fan-on]="consultorio.ventiladores()[2]?.encendido"
            (click)="tocarActuador('VENTILADOR_3')"
          >
            <ion-icon
              [name]="consultorio.ventiladores()[2]?.encendido ? 'sync-circle' : 'sync-circle-outline'"
              [class.spin]="consultorio.ventiladores()[2]?.encendido"
            ></ion-icon>
            <span>V3 • {{ consultorio.ventiladores()[2]?.encendido ? 'ON' : 'OFF' }}</span>
          </button>

          @for (asiento of asientosDerecha(); track asiento.numero) {
            <div class="seat-card" [class.seat-occupied]="asiento.ocupado">
              <ion-icon [name]="asiento.ocupado ? 'person' : 'person-outline'"></ion-icon>
              <div class="seat-text">
                <strong>Silla #{{ asiento.numero }}</strong>
                <span>{{ asiento.ocupado ? 'Ocupada (IR)' : 'Disponible' }}</span>
              </div>
            </div>
          }

          <button
            type="button"
            class="fan-btn"
            [class.fan-on]="consultorio.ventiladores()[3]?.encendido"
            (click)="tocarActuador('VENTILADOR_4')"
          >
            <ion-icon
              [name]="consultorio.ventiladores()[3]?.encendido ? 'sync-circle' : 'sync-circle-outline'"
              [class.spin]="consultorio.ventiladores()[3]?.encendido"
            ></ion-icon>
            <span>V4 • {{ consultorio.ventiladores()[3]?.encendido ? 'ON' : 'OFF' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .consultorio-plano {
        background: #FFFFFF;
        border: 1px solid #EFEBE9;
        border-radius: 14px;
        padding: 12px;
      }
      .top-infra-bar {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }
      @media (max-width: 480px) {
        .top-infra-bar {
          grid-template-columns: 1fr;
        }
      }
      .infra-chip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 10px;
        border-radius: 10px;
        border: 1px solid #EFEBE9;
        background: #F9F7F4;
        color: #5C5552;
        font-size: 0.78rem;
        cursor: pointer;
        transition: transform 0.15s ease;
      }
      .infra-chip:active {
        transform: scale(0.98);
      }
      .led-on {
        background: #FFF3E0;
        border-color: #FFCC80;
        color: #E65100;
      }
      .puerta-abierta {
        background: #E8F5E9;
        border-color: #A5D6A7;
        color: #2E7D32;
      }
      .sala-grid {
        display: grid;
        grid-template-columns: 1fr 44px 1fr;
        gap: 8px;
        align-items: stretch;
      }
      .hilera-col {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .hilera-label {
        text-align: center;
        font-size: 0.7rem;
        font-weight: 800;
        color: #6E6663;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .fan-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 6px;
        border-radius: 10px;
        background: #F9F7F4;
        border: 1px solid #EFEBE9;
        color: #6E6663;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .fan-btn:active {
        transform: scale(0.97);
      }
      .fan-on {
        background: #F7E6EA;
        border-color: #E5C2CC;
        color: #B01E53;
      }
      .spin {
        animation: girar 1.3s linear infinite;
      }
      @keyframes girar {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .seat-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 10px;
        border-radius: 11px;
        border: 1px solid #EFEBE9;
        background: #FFFFFF;
      }
      .seat-card ion-icon {
        font-size: 1.35rem;
        color: #43A047;
        flex-shrink: 0;
      }
      .seat-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .seat-text strong {
        font-size: 0.82rem;
        color: #1E1E1E;
      }
      .seat-text span {
        font-size: 0.7rem;
        font-weight: 600;
        color: #43A047;
      }
      .seat-occupied {
        border-color: #E5C2CC;
        background: #F7E6EA;
      }
      .seat-occupied ion-icon {
        color: #B01E53;
      }
      .seat-occupied .seat-text span {
        color: #B01E53;
      }
      .pasillo-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
      }
      .puerta-tag {
        font-size: 0.56rem;
        font-weight: 800;
        background: #F9F7F4;
        border: 1px solid #EFEBE9;
        color: #A0A0A0;
        padding: 3px 5px;
        border-radius: 6px;
      }
      .pasillo-line {
        width: 1.5px;
        flex: 1;
        background: repeating-linear-gradient(
          to bottom,
          #E0D8D5 0,
          #E0D8D5 5px,
          transparent 5px,
          transparent 10px
        );
        margin: 6px 0;
      }
      .pasillo-text {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 2px;
        color: #A0A0A0;
      }
    `,
  ],
})
export class MapaAsientosComponent {
  consultorio = inject(ConsultorioService);

  constructor() {
    addIcons({
      person,
      personOutline,
      syncCircle,
      syncCircleOutline,
      bulb,
      bulbOutline,
      lockOpenOutline,
      lockClosedOutline,
    });
  }

  asientosIzquierda() {
    return this.consultorio.asientos().filter((a) => a.hilera === 'IZQUIERDA');
  }

  asientosDerecha() {
    return this.consultorio.asientos().filter((a) => a.hilera === 'DERECHA');
  }

  tocarActuador(id: DispositivoId): void {
    this.consultorio.alternarActuadorConRetornoAuto(id);
  }

  tocarPuerta(): void {
    this.consultorio.alternarPuertaManual();
  }
}