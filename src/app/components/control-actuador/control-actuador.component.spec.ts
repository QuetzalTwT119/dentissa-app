import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlActuadorComponent } from './control-actuador.component';

describe('ControlActuadorComponent', () => {
  let component: ControlActuadorComponent;
  let fixture: ComponentFixture<ControlActuadorComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlActuadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
