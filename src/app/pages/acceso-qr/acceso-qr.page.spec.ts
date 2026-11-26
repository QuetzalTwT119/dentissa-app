import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccesoQrPage } from './acceso-qr.page';

describe('AccesoQrPage', () => {
  let component: AccesoQrPage;
  let fixture: ComponentFixture<AccesoQrPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccesoQrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
