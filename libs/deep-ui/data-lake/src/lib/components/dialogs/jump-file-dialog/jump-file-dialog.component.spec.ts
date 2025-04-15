import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DatasetService} from 'deep-ui/shared/core';
import {getFakeDataset, getFakePerfectDatasource, getFakeQueryJson} from 'deep-ui/shared/testing';

import {JumpFileDialogComponent} from './jump-file-dialog.component';

describe('JumpFileDialogComponent', () => {
  let spectator: Spectator<JumpFileDialogComponent>;
  const createComponent = createComponentFactory({
    component: JumpFileDialogComponent,
    imports: [
      MatDialogModule,
      MatButtonModule,
      MeInputComponent,
      MatProgressSpinnerModule,
      MatRadioModule,
      MatIconModule,
      MeTooltipDirective,
      MatFormFieldModule,
      FormsModule,
    ],
    mocks: [DatasetService, MeSnackbarService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.component.dataset = getFakeDataset(true);
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('isJumpFileEnabled', () => {
    it('should be false', () => {
      const fakeDatasource = getFakePerfectDatasource(true).fakeDataSource;
      const dataset = getFakeDataset(true);
      dataset.queryJson = getFakeQueryJson(fakeDatasource.id, true, []);
      spectator.component.dataset = dataset;

      spectator.detectChanges();

      expect(spectator.component.isJumpFileEnabled).toBeFalse();
    });

    it('should be true', () => {
      const fakeDatasource = getFakePerfectDatasource(true).fakeDataSource;
      const dataset = getFakeDataset(true);
      dataset.queryJson = getFakeQueryJson(fakeDatasource.id, true, ['col1']);
      spectator.component.dataset = dataset;

      spectator.detectChanges();

      expect(spectator.component.isJumpFileEnabled).toBeTruthy();
    });
  });
});
