import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MeDragDropListComponent} from '@mobileye/material/src/lib/components/form/drag-drop-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeParametersListComponent} from '@mobileye/material/src/lib/components/form/parameters-list';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {of} from 'rxjs';

import {MestFormComponent} from './mest-form.component';
import SpyObj = jasmine.SpyObj;
import {MeTourStepComponent} from '@mobileye/material/src/lib/components/tour-step';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeTourService} from '@mobileye/material/src/lib/services/tour';
import {
  DeepUtilService,
  DEFAULT_RETRY_ATTEMPTS,
  OnPremService,
  QueryFileSystem,
} from 'deep-ui/shared/core';

describe('MestFormComponent', () => {
  let spectator: Spectator<MestFormComponent>;
  let onPremService: SpyObj<OnPremService>;

  const createComponent = createComponentFactory({
    component: MestFormComponent,
    imports: [
      MeDragDropListComponent,
      MeParametersListComponent,
      MatIconModule,
      MatIconTestingModule,
      MatButtonModule,
      MeInputComponent,
      MeSelectComponent,
      MeTextareaComponent,
      MeTooltipDirective,
      MeTourStepComponent,
      ReactiveFormsModule,
    ],
    providers: [MeTourService, DeepUtilService],
    mocks: [OnPremService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    onPremService = spectator.inject(OnPremService);
    const fakeResponse: QueryFileSystem = {
      retries: DEFAULT_RETRY_ATTEMPTS,
      paths: [
        {
          absolutePath: 'some-path/other-path/file1.txt',
          type: 'file',
          found: true,
        },
      ],
    };
    onPremService.queryFileSystem.and.returnValue(of(fakeResponse));
    onPremService.queryPaths.and.returnValue(of(fakeResponse));
    onPremService.queryPathsFileSystem.and.returnValue(of(fakeResponse));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('removeBasePathFromString', () => {
    it('should remove base path', () => {
      spectator.component.formMode = 'override';
      spectator.component.cancelButtonLabel = 'Override MEST CMD';
      spectator.detectChanges();
      spectator.component.mestForm.controls.rootPath.setValue('/some-root/path2/path3/');
      spectator.detectChanges();

      spectator.component.selectedExecutable.set('/some-root/path2/path3/ok1/ok2.txt');

      expect(spectator.component.executableWithoutBasePath()).toBe('ok1/ok2.txt');
    });
  });
});
