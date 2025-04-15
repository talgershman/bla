import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataLoaderService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {MestCloudCmdComponent} from './mest-cloud-cmd.component';

describe('MestCloudCmdComponent', () => {
  let spectator: Spectator<MestCloudCmdComponent>;
  let dataLoaderService: SpyObject<DataLoaderService>;

  const createComponent = createComponentFactory({
    component: MestCloudCmdComponent,
    imports: [
      MatDialogModule,
      MatButtonModule,
      MatProgressSpinnerModule,
      ReactiveFormsModule,
      MeErrorFeedbackComponent,
      MatIconModule,
    ],
    mocks: [MatDialogRef, DataLoaderService, MeSnackbarService],
    componentProviders: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          jobUuid: 'some_id',
        },
      },
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    dataLoaderService = spectator.inject(DataLoaderService);

    dataLoaderService.getMestCloudCmd.and.returnValue(of({cmd: 'bla bla'}));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
