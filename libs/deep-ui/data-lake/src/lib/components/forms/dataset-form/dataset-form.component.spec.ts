import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasetService, DatasourceService} from 'deep-ui/shared/core';
import {NgxMaskPipe, provideEnvironmentNgxMask} from 'ngx-mask';

import {QueryUtilService} from '../../../query-utils/query-util.service';
import {ExecuteQueryWebSocketsManagerService} from '../../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {ExpiredAtDataRetentionControlComponent} from '../../controls/expired-at-data-retention-control/expired-at-data-retention-control.component';
import {QueryDashboardControlComponent} from '../../controls/query-dashboard-control/query-dashboard-control.component';
import {DatasetFormComponent} from './dataset-form.component';
import {DatasetFormService} from './dataset-form.service';

describe('DatasetFormComponent', () => {
  let spectator: Spectator<DatasetFormComponent>;
  let router: SpyObject<Router>;

  const createComponent = createComponentFactory({
    component: DatasetFormComponent,
    imports: [
      MatButtonModule,
      MeInputComponent,
      MeTextareaComponent,
      MeSelectComponent,
      MatIconModule,
      ReactiveFormsModule,
      MeTooltipDirective,
      MatFormFieldModule,
      MatCheckboxModule,
      HintIconComponent,
      NgxMaskPipe,
      QueryDashboardControlComponent,
      RouterTestingModule,
      ExpiredAtDataRetentionControlComponent,
      MeFormControlChipsFieldComponent,
    ],
    providers: [DatasetFormService, QueryUtilService, provideEnvironmentNgxMask()],
    mocks: [
      ExecuteQueryWebSocketsManagerService,
      DatasetService,
      DatasourceService,
      MeDownloaderService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onSubmit', () => {
    it('should create', () => {
      spyOn(spectator.component.datasetForm, 'markAsTouched');
      spyOn(spectator.component.datasetForm.controls.name, 'updateValueAndValidity');
      spectator.detectChanges();

      spectator.component.onSubmit();

      expect(spectator.component.datasetForm.markAsTouched).toHaveBeenCalled();
      expect(
        spectator.component.datasetForm.controls.name.updateValueAndValidity,
      ).toHaveBeenCalled();

      expect(spectator.component).toBeTruthy();
    });
  });

  describe('onBackButtonPressed', () => {
    it('should navigate', () => {
      spyOn(router, 'navigate');
      spectator.detectChanges();

      spectator.component.onBackButtonPressed();

      expect(router.navigate).toHaveBeenCalledWith(['./data-lake/datasets']);
    });
  });
});
