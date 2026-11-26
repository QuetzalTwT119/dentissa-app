import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TotpService {
  readonly PERIODO_SEGUNDOS = 30;

  obtenerSegundosRestantes(): number {
    const epochSegundos = Math.floor(Date.now() / 1000);
    return this.PERIODO_SEGUNDOS - (epochSegundos % this.PERIODO_SEGUNDOS);
  }

  async generarCodigo(secretBase32: string, offsetVentana = 0): Promise<string> {
    const keyBuffer = this.base32ToArrayBuffer(secretBase32);
    const counter =
      Math.floor(Date.now() / 1000 / this.PERIODO_SEGUNDOS) + offsetVentana;

    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setUint32(0, Math.floor(counter / 0x100000000), false);
    view.setUint32(4, counter >>> 0, false);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hmac = new Uint8Array(signature);

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (binary % 1000000).toString().padStart(6, '0');
  }

  async generarPayloadQr(userId: string, secretBase32: string): Promise<{
    payload: string;
    codigoOtp: string;
  }> {
    const codigoOtp = await this.generarCodigo(secretBase32, 0);
    return {
      payload: `DENTISSA:${userId}:${codigoOtp}`,
      codigoOtp,
    };
  }

  async verificarCodigo(secretBase32: string, codigoRecibido: string): Promise<boolean> {
    const limpio = codigoRecibido.trim();
    if (!/^\d{6}$/.test(limpio)) return false;

    for (const ventana of [0, -1, 1]) {
      const esperado = await this.generarCodigo(secretBase32, ventana);
      if (esperado === limpio) {
        return true;
      }
    }
    return false;
  }

  private base32ToArrayBuffer(base32: string): ArrayBuffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < clean.length; i++) {
      const idx = alphabet.indexOf(clean[i]);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return new Uint8Array(output).buffer;
  }
}
