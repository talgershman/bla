import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {EtlJobService} from 'deep-ui/shared/core';
import {getFakeEtlJob} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {UpdateJobComponent} from './update-job.component';

describe('UpdateJobComponent', () => {
  let spectator: Spectator<UpdateJobComponent>;
  const createComponent = createComponentFactory({
    component: UpdateJobComponent,
    imports: [
      MeFormControlChipsFieldComponent,
      MatDialogModule,
      MatButtonModule,
      MatSlideToggleModule,
      ReactiveFormsModule,
      MatProgressSpinnerModule,
    ],
    mocks: [EtlJobService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onSaveClicked', () => {
    it('send request - only dirty fields', () => {
      const etlJobService = spectator.inject<EtlJobService>(EtlJobService);
      spectator.component.etlJob = getFakeEtlJob();
      spectator.detectChanges();

      etlJobService.updateJob.and.returnValue(of(null));

      spectator.detectChanges();
      spectator.component.form.controls.tags.setValue(['new-value']);
      spectator.detectChanges();

      spectator.component.onSaveClicked();

      expect(etlJobService.updateJob).toHaveBeenCalledWith(spectator.component.etlJob.jobUuid, {
        tags: ['new-value'],
      });
    });

    it('send not send request - no dirty fields', () => {
      const etlJobService = spectator.inject<EtlJobService>(EtlJobService);
      spectator.component.etlJob = getFakeEtlJob();
      spectator.detectChanges();

      spectator.component.onSaveClicked();

      expect(etlJobService.updateJob).not.toHaveBeenCalled();
    });
  });
});
