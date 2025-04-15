import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {
  MeUploadFileComponent,
  MeUploadFileComponentMock,
} from '@mobileye/material/src/lib/components/upload-file';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeZipService} from '@mobileye/material/src/lib/services/zip';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {AssetManagerService, OnPremService, PerfectListService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {PerfectListFormComponent} from './perfect-list-form.component';

describe('PerfectListFormComponent', () => {
  let spectator: Spectator<PerfectListFormComponent>;
  let assetManagerService: SpyObject<AssetManagerService>;

  const createComponent = createComponentFactory({
    component: PerfectListFormComponent,
    mocks: [AssetManagerService, PerfectListService, OnPremService, MeZipService],
    imports: [
      FormsModule,
      ReactiveFormsModule,
      MeTooltipDirective,
      MeInputComponent,
      MeTextareaComponent,
      MatButtonModule,
      MeSelectComponent,
      MeFormControlChipsFieldComponent,
      MeControlListComponent,
      MeUploadFileComponent,
    ],
    overrideComponents: [
      [
        MeUploadFileComponent,
        {
          remove: {
            imports: [MeUploadFileComponent],
          },
          add: {
            imports: [MeUploadFileComponentMock],
          },
        },
      ],
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    assetManagerService = spectator.inject(AssetManagerService);
    assetManagerService.getTechnologiesOptions.and.returnValue(of([{id: 'AV', value: 'AV'}]));
  });

  it('should create', () => {
    spectator.fixture.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
