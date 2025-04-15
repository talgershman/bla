import {NgOptimizedImage} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {RouterTestingModule} from '@angular/router/testing';
import {MsalService} from '@azure/msal-angular';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {LoginComponent} from './login.component';

describe('LoginComponent', () => {
  let spectator: Spectator<LoginComponent>;
  const createComponent = createComponentFactory({
    component: LoginComponent,
    imports: [MatButtonModule, MatFormFieldModule, RouterTestingModule, NgOptimizedImage],
    mocks: [MsalService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
