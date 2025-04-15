import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgCustomDetailComponent} from './ag-custom-detail.component';

describe('MeAgCustomDetailComponent', () => {
  let spectator: Spectator<MeAgCustomDetailComponent<any>>;

  const createComponent = createComponentFactory({
    component: MeAgCustomDetailComponent,
    imports: [],
    providers: [MeTimerService],
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
