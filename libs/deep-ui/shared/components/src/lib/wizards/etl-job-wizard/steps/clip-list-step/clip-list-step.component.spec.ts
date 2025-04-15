import {ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MeToastComponent} from '@mobileye/material/src/lib/components/toast';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {SelectClipListComponent} from 'deep-ui/shared/components/src/lib/selection/select-clip-list';
import {ToastrService} from 'ngx-toastr';

import {ClipListStepComponent} from './clip-list-step.component';

describe('ClipListStepComponent', () => {
  let spectator: Spectator<ClipListStepComponent>;

  const createComponent = createComponentFactory({
    component: ClipListStepComponent,
    imports: [
      SelectClipListComponent,
      ReactiveFormsModule,
      MeToastComponent,
      BrowserAnimationsModule,
    ],
    mocks: [MeAzureGraphService, ToastrService],
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
