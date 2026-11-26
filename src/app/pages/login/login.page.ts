import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  medkitOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  template: `
    <ion-content class="login-content">
      <div class="page-center">
        <div class="split-card">
          <!-- PANEL IZQUIERDO EDITORIAL -->
          <div class="left-panel">
            <div class="brand-header">
              <div class="brand-logo">
                <ion-icon name="medkit-outline"></ion-icon>
              </div>
              <div>
                <div class="brand-name">DENTISA</div>
                <div class="brand-tag">ODONTOLOGÍA INTEGRAL &amp; IoT</div>
              </div>
            </div>

            <div class="hero-copy">
              <div class="pill-badge">
                <span class="pill-dot"></span>
                <span>ESPACIO DE TRABAJO DENTISA</span>
              </div>
              <h1>Cada cita merece una atención bien coordinada.</h1>
              <p>
                Control inteligente de sala de espera, ventilación, iluminación y acceso QR para el equipo clínico.
              </p>
            </div>

            <div class="left-footer">
              <ion-icon name="lock-closed-outline"></ion-icon>
              <span>Acceso privado del consultorio</span>
            </div>
          </div>

          <!-- PANEL DERECHO FORMULARIO -->
          <div class="right-panel">
            <div class="form-container">
              <div class="eyebrow">
                <span class="line"></span>
                <span>ACCESO PROFESIONAL</span>
              </div>

              <h2>Hola de nuevo</h2>

              <div class="field-group">
                <label for="emailInput">Correo electrónico</label>
                <div class="input-box">
                  <input
                    id="emailInput"
                    type="email"
                    placeholder="nombre@consultorio.com"
                    autocomplete="email"
                    [(ngModel)]="email"
                    (keyup.enter)="entrar()"
                  />
                </div>
              </div>

              <div class="field-group">
                <label for="passInput">Contraseña</label>
                <div class="input-box">
                  <input
                    id="passInput"
                    [type]="verPassword() ? 'text' : 'password'"
                    placeholder="••••••••••••"
                    autocomplete="current-password"
                    [(ngModel)]="password"
                    (keyup.enter)="entrar()"
                  />
                  <button
                    type="button"
                    class="eye-btn"
                    (click)="verPassword.set(!verPassword())"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    <ion-icon [name]="verPassword() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                  </button>
                </div>
              </div>

              @if (errorMsg()) {
                <div class="error-banner">{{ errorMsg() }}</div>
              }

              <ion-button
                expand="block"
                class="submit-btn"
                [disabled]="cargando()"
                (click)="entrar()"
              >
                @if (cargando()) {
                  <ion-spinner name="crescent" class="btn-spin"></ion-spinner>
                  <span>Verificando...</span>
                } @else {
                  <span>Iniciar sesión</span>
                  <ion-icon slot="end" name="arrow-forward-outline"></ion-icon>
                }
              </ion-button>

              <div class="security-note">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <span>Tu información está protegida y solo es visible para usuarios autorizados.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .login-content {
        --background: #f5ecee;
      }
      .page-center {
        min-height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
      }
      .split-card {
        width: 100%;
        max-width: 920px;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1fr;
        box-shadow: 0 20px 50px rgba(92, 34, 52, 0.12);
        border: 1px solid #ecd9dd;
      }
      @media (min-width: 780px) {
        .split-card {
          grid-template-columns: 1.02fr 1fr;
          min-height: 540px;
        }
      }

      /* PANEL IZQUIERDO */
      .left-panel {
        background: linear-gradient(155deg, #6e233b 0%, #9c3353 52%, #b84b6b 100%);
        color: #ffffff;
        padding: 28px 26px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 24px;
        position: relative;
      }
      .brand-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .brand-logo {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #ffffff;
        color: #9c3353;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }
      .brand-name {
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: 1px;
        line-height: 1.1;
      }
      .brand-tag {
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 1.2px;
        opacity: 0.88;
        margin-top: 2px;
      }
      .hero-copy {
        margin: auto 0;
      }
      .pill-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: rgba(255, 255, 255, 0.16);
        backdrop-filter: blur(6px);
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 0.64rem;
        font-weight: 800;
        letter-spacing: 0.9px;
        margin-bottom: 14px;
      }
      .pill-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ffb3c6;
      }
      .hero-copy h1 {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.2;
        margin: 0 0 12px;
        color: #ffffff;
      }
      @media (min-width: 780px) {
        .hero-copy h1 {
          font-size: 2.05rem;
        }
      }
      .hero-copy p {
        font-size: 0.84rem;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.88);
        margin: 0;
      }
      .left-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.76rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.88);
      }

      /* PANEL DERECHO */
      .right-panel {
        padding: 32px 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
      }
      @media (min-width: 780px) {
        .right-panel {
          padding: 40px 44px;
        }
      }
      .form-container {
        width: 100%;
        max-width: 340px;
      }
      .eyebrow {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 1.3px;
        color: #9c3353;
        margin-bottom: 8px;
      }
      .eyebrow .line {
        width: 18px;
        height: 1.5px;
        background: #9c3353;
      }
      .form-container h2 {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1.85rem;
        font-weight: 700;
        color: #1f1719;
        margin: 0 0 22px;
      }
      .field-group {
        margin-bottom: 16px;
      }
      .field-group label {
        display: block;
        font-size: 0.78rem;
        font-weight: 700;
        color: #3a2d30;
        margin-bottom: 6px;
      }
      .input-box {
        display: flex;
        align-items: center;
        border: 1.5px solid #e2cdd2;
        border-radius: 12px;
        background: #fdfafb;
        padding: 0 12px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .input-box:focus-within {
        border-color: #a83256;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(168, 50, 86, 0.12);
      }
      .input-box input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 12px 4px;
        font-size: 0.88rem;
        color: #1f1719;
        outline: none;
      }
      .input-box input::placeholder {
        color: #a8969a;
      }
      .eye-btn {
        background: transparent;
        border: none;
        color: #7d686c;
        font-size: 1.15rem;
        padding: 4px;
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      .error-banner {
        background: #fde8ec;
        border: 1px solid #f5b7c3;
        color: #9e1c34;
        font-size: 0.76rem;
        font-weight: 700;
        padding: 9px 12px;
        border-radius: 10px;
        margin-bottom: 14px;
        line-height: 1.35;
      }
      .submit-btn {
        --background: #a83256;
        --background-hover: #8f2646;
        --border-radius: 999px;
        --box-shadow: 0 8px 20px rgba(168, 50, 86, 0.28);
        height: 46px;
        font-weight: 700;
        font-size: 0.88rem;
        text-transform: none;
        margin: 8px 0 18px;
      }
      .btn-spin {
        width: 18px;
        height: 18px;
        margin-right: 8px;
      }
      .security-note {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 0.72rem;
        line-height: 1.4;
        color: #6e5c60;
      }
      .security-note ion-icon {
        color: #1e8e54;
        font-size: 1rem;
        flex-shrink: 0;
        margin-top: 1px;
      }
    `,
  ],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  verPassword = signal<boolean>(false);
  cargando = signal<boolean>(false);
  errorMsg = signal<string>('');

  constructor() {
    addIcons({
      medkitOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowForwardOutline,
      shieldCheckmarkOutline,
    });
  }

  async entrar(): Promise<void> {
    if (this.cargando()) return;
    this.errorMsg.set('');
    this.cargando.set(true);

    const res = await this.auth.iniciarSesion(this.email, this.password);
    this.cargando.set(false);

    if (res.ok) {
      this.router.navigateByUrl('/tabs/sala');
    } else {
      this.errorMsg.set(res.mensaje || 'No se pudo iniciar sesión.');
    }
  }
}
