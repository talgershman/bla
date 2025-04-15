import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeWizardButtonsComponent} from './wizard-buttons.component';

describe('MeWizardButtonsComponent', () => {
  let spectator: Spectator<MeWizardButtonsComponent>;

  const createComponent = createComponentFactory({
    component: MeWizardButtonsComponent,
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
