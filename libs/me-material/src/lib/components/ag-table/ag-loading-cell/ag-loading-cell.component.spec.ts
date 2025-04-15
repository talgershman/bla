import {ILoadingCellRendererParams} from '@ag-grid-community/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgLoadingCellComponent} from './ag-loading-cell.component';

describe('MeAgLoadingCellComponent', () => {
  let spectator: Spectator<MeAgLoadingCellComponent>;
  const createComponent = createComponentFactory({
    component: MeAgLoadingCellComponent,
    imports: [MatProgressSpinnerModule, MatFormFieldModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should initialize ag-grid parameters', () => {
    spectator.detectChanges();
    const mockParams: ILoadingCellRendererParams = {
      node: null,
      api: null,
      context: null,
      value: null,
      valueFormatted: null,
      data: null,
      eGridCell: null,
      eParentOfValue: null,
      registerRowDragger: null,
      setTooltip: null,
    };
    spyOn(spectator.component, 'agInit');
    spectator.component.agInit(mockParams);

    expect(spectator.component.agInit).toHaveBeenCalledWith(mockParams);
  });
});
