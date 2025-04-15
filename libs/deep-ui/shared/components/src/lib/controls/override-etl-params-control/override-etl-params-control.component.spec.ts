import {FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatError} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {OverrideEtlParamsControlComponent} from 'deep-ui/shared/components/src/lib/controls/override-etl-params-control/override-etl-params-control.component';
import {OverrideEtlParamsControlService} from 'deep-ui/shared/components/src/lib/controls/override-etl-params-control/override-etl-params-control.service';

describe('OverrideEtlParamsControlComponent', () => {
  let spectator: Spectator<OverrideEtlParamsControlComponent>;

  const createComponent = createComponentFactory({
    component: OverrideEtlParamsControlComponent,
    imports: [
      ReactiveFormsModule,
      MeJsonEditorComponent,
      MeControlListComponent,
      MeInputComponent,
      MatIconModule,
      MatButtonModule,
      MatInputModule,
      MatError,
      MatSlideToggle,
      HintIconComponent,
    ],
    componentProviders: [
      {provide: NgControl, useValue: {control: new FormControl<any>(null)}},
      OverrideEtlParamsControlService,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
