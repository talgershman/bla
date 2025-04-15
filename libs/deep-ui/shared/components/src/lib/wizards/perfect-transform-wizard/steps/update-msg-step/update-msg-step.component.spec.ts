import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {UpdateMsgStepComponent} from './update-msg-step.component';

describe('UpdateMsgStepComponent', () => {
  let spectator: Spectator<UpdateMsgStepComponent>;
  const createComponent = createComponentFactory({
    component: UpdateMsgStepComponent,
    imports: [],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
