import {MatProgressSpinnerModule, MatSpinner} from '@angular/material/progress-spinner';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgLoadingOverlayComponent} from './ag-loading-overlay.component';

describe('MeAgLoadingOverlayComponent', () => {
  let spectator: Spectator<MeAgLoadingOverlayComponent>;

  const createComponent = createComponentFactory({
    component: MeAgLoadingOverlayComponent,
    imports: [MatProgressSpinnerModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should display the loading spinner by default', () => {
    spectator.detectChanges();

    expect(spectator.query(MatSpinner)).not.toBeNull();
  });

  it('should display the loading spinner when params.showLoading is true', () => {
    spectator.detectChanges();

    const params: any = {showLoading: true};
    spectator.component.agInit(params);

    expect(spectator.query(MatSpinner)).not.toBeNull();
  });
});
