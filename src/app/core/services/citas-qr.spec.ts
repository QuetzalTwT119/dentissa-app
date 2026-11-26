import { TestBed } from '@angular/core/testing';
import { CitasQr } from './citas-qr';

describe('CitasQr', () => {
  let service: CitasQr;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CitasQr);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
