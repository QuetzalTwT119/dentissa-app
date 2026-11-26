import { Component, inject } from '@angular/core';
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  documentTextOutline,
  gridOutline,
  qrCodeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ConsultorioService } from '../../core/services/consultorio.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom" style="--background: #FFFFFF; --border: 1px solid #EFEBE9; --color: #A0A0A0; --color-selected: #B01E53;">
        <ion-tab-button tab="sala" href="/tabs/sala">
          <ion-icon name="grid-outline"></ion-icon>
          <ion-label>Sala &amp; IoT</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="qr" href="/tabs/qr">
          <ion-icon name="qr-code-outline"></ion-icon>
          <ion-label>Acceso QR</ion-label>
        </ion-tab-button>

        @if (auth.esSuperAdmin() && consultorio.historialDisponible()) {
          <ion-tab-button tab="estadisticas" href="/tabs/estadisticas">
            <ion-icon name="bar-chart-outline"></ion-icon>
            <ion-label>Estadísticas</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="auditoria" href="/tabs/auditoria">
            <ion-icon name="document-text-outline"></ion-icon>
            <ion-label>Auditoría</ion-label>
          </ion-tab-button>
        }
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  readonly auth = inject(AuthService);
  readonly consultorio = inject(ConsultorioService);

  constructor() {
    addIcons({
      gridOutline,
      qrCodeOutline,
      barChartOutline,
      documentTextOutline,
    });
  }
}