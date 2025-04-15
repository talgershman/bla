import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgNoRowsOverlayComponent} from './ag-no-rows-overlay.component';

describe('MeAgNoRowsOverlayComponent', () => {
  let spectator: Spectator<MeAgNoRowsOverlayComponent>;

  const createComponent = createComponentFactory({
    component: MeAgNoRowsOverlayComponent,
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
