import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {MatSliderModule} from '@angular/material/slider';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {of} from 'rxjs';

import {
  fakeETL,
  fakeParsingConfigs,
  fakeServiceNames,
  fakeServices,
} from '../../../etls/view-etl/view-etl.resolver.spec';
import {EtlDiagramNode} from '../etl-form-base.service';
import {EtlValidationFormComponent} from './etl-validation-form.component';
import {EtlValidationFormService} from './etl-validation-form.service';
import SpyObj = jasmine.SpyObj;
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {PickerControlComponent} from 'deep-ui/shared/components/src/lib/controls/picker-control';
import {EtlService} from 'deep-ui/shared/core';
import {EtlServiceTypes, EtlTypeEnum} from 'deep-ui/shared/models';

describe('EtlValidationFormComponent', () => {
  let spectator: Spectator<EtlValidationFormComponent>;
  let etlService: SpyObj<EtlService>;

  const createComponent = createComponentFactory({
    component: EtlValidationFormComponent,
    imports: [
      MatButtonModule,
      ReactiveFormsModule,
      MeInputComponent,
      MeTextareaComponent,
      MeSelectComponent,
      MeAutocompleteComponent,
      MatIconModule,
      MeFormControlChipsFieldComponent,
      MeJsonEditorComponent,
      MeAreYouSureDialogComponent,
      MatCheckboxModule,
      MatSliderModule,
      MeTooltipDirective,
      HintIconComponent,
      MatSlideToggleModule,
      MeSafePipe,
      PickerControlComponent,
      NgTemplateOutlet,
      AsyncPipe,
    ],
    providers: [EtlValidationFormService],
    mocks: [EtlService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    etlService = spectator.inject(EtlService);
    etlService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    etlService.getServices.and.returnValue(of(fakeServices));
    spectator.component.serviceNames = fakeServiceNames;
    spectator.component.etl = fakeETL;
    spectator.component.parsingConfigs = fakeParsingConfigs;
    spectator.component.type = EtlTypeEnum.VALIDATION;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onSubmit', () => {
    it('form invalid, should not emit', async () => {
      spectator.component.etl = undefined;
      spectator.detectChanges();
      spyOn(spectator.component.fromValueChanged, 'emit');

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledTimes(0);
    });

    it('form valid, should emit', async () => {
      spectator.detectChanges();
      spectator.component.etl = undefined;
      spyOn(spectator.component.fromValueChanged, 'emit');

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('onNodeClicked', () => {
    it('should select template', () => {
      const fakeNode: EtlDiagramNode = {
        title: 'root',
        id: 'id',
        formGroupName: 'probeLogicForm',
        formGroup: new FormGroup<any>({a: new FormControl<any>(null)}),
        formTemplateKey: 'probeLogicFormTemplate',
      };
      const fakeDiv = document.createElement('div');
      spectator.detectChanges();

      spectator.component.onNodeClicked(fakeNode, fakeDiv);

      expect(spectator.component.selectedNode).toEqual(fakeNode);
      expect(spectator.component.selectNodeTemplate).toEqual(
        spectator.component.probeLogicFormTemplate,
      );
    });
  });

  describe('onVersionChanged', () => {
    it('should set dataPrep configuration control', () => {
      const fakeSelected: any = {
        name: fakeServices[1].version,
      };

      spectator.detectChanges();

      spectator.component.onVersionChanged(
        fakeSelected,
        spectator.component.serviceNames[1].name,
        EtlServiceTypes.DataPrep,
      );

      expect(
        spectator.component.etlForm.controls.probeLogicForm.controls.configuration.value,
      ).toEqual(fakeServices[1].configuration);
    });

    it('should set probeLogic configuration control', () => {
      const fakeSelected: any = {
        name: fakeServices[0].version,
      };

      spectator.detectChanges();

      spectator.component.onVersionChanged(
        fakeSelected,
        spectator.component.serviceNames[0].name,
        EtlServiceTypes.ProbeLogic,
      );

      expect(
        spectator.component.etlForm.controls.probeLogicForm.controls.configuration.value,
      ).toEqual(fakeServices[0].configuration);
    });

    it('should reset configuration control on empty service configuration', () => {
      fakeServices[3].configuration = null;
      const fakeSelected: any = {
        name: fakeServices[3].version,
      };
      spectator.detectChanges();
      spectator.component.etlForm.controls.dataPrepForm.controls.configuration.setValue({
        invalid: true,
      });

      spectator.component.onVersionChanged(
        fakeSelected,
        spectator.component.serviceNames[3].name,
        EtlServiceTypes.DataPrep,
      );

      expect(
        spectator.component.etlForm.controls.dataPrepForm.controls.configuration.value,
      ).toBeNull();
    });
  });
});
