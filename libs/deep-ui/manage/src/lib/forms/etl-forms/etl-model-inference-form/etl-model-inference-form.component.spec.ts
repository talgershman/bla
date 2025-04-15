import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {EtlService} from 'deep-ui/shared/core';
import {EtlServiceTypes, EtlTypeEnum} from 'deep-ui/shared/models';
import {getFakeETL, getFakeEtlDagService, getFakeEtlServiceNames} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {fakeParsingConfigs} from '../../../etls/view-etl/view-etl.resolver.spec';
import {EtlDiagramNode} from '../etl-form-base.service';
import {EtlModelInferenceFormComponent} from './etl-model-inference-form.component';
import {EtlModelInferenceFormService} from './etl-model-inference-form.service';

export const fakeServices = [
  getFakeEtlDagService(true, {type: 'logic'}),
  getFakeEtlDagService(true, {type: 'genericDataPrep', version: '1.1.1master'}),
  getFakeEtlDagService(true, {type: 'logic', version: '1.2.dev'}),
  getFakeEtlDagService(true, {type: 'genericDataPrep', version: '1.4.dev'}),
];
export const fakeServiceNames = getFakeEtlServiceNames(fakeServices);

export const fakeETL = getFakeETL(true, {
  team: 'deep-fpa-objects',
  parsingConfiguration: fakeParsingConfigs[0].id,
  services: {
    [fakeServices[1].id.toString()]: fakeServices[1],
    [fakeServices[0].id.toString()]: fakeServices[0],
  },
  servicesDag: {
    root: [fakeServices[1].id.toString()],
    [fakeServices[1].id]: [fakeServices[0].id.toString()],
    [fakeServices[0].id]: ['BI'],
  },
  sdkStatus: {
    status: 'deprecated',
    msg: 'Version 13.3.12 is deprecated',
  },
});

describe('EtlModelInferenceFormComponent', () => {
  let spectator: Spectator<EtlModelInferenceFormComponent>;
  let etlService: SpyObject<EtlService>;

  const createComponent = createComponentFactory({
    component: EtlModelInferenceFormComponent,
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
      MatSlideToggleModule,
      HintIconComponent,
      MeSafePipe,
      NgTemplateOutlet,
      AsyncPipe,
    ],
    providers: [EtlModelInferenceFormService],
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
    spectator.component.type = EtlTypeEnum.MODEL_INFERENCE;
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
        formGroupName: 'logicForm',
        formGroup: new FormGroup<any>({a: new FormControl<any>(null)}),
        formTemplateKey: 'logicFormTemplate',
      };
      const fakeDiv = document.createElement('div');
      spectator.detectChanges();

      spectator.component.onNodeClicked(fakeNode, fakeDiv);

      expect(spectator.component.selectedNode).toEqual(fakeNode);
      expect(spectator.component.selectNodeTemplate).toEqual(spectator.component.logicFormTemplate);
    });
  });

  describe('onVersionChanged', () => {
    it('should set genericDataPrep configuration control', () => {
      const fakeSelected: any = {
        name: fakeServices[1].version,
      };

      spectator.detectChanges();

      spectator.component.onVersionChanged(
        fakeSelected,
        spectator.component.serviceNames[1].name,
        EtlServiceTypes.GenericDataPrep,
      );

      expect(spectator.component.etlForm.controls.logicForm.controls.configuration.value).toEqual(
        fakeServices[1].configuration,
      );
    });

    it('should set logic configuration control', () => {
      const fakeSelected: any = {
        name: fakeServices[0].version,
      };

      spectator.detectChanges();

      spectator.component.onVersionChanged(
        fakeSelected,
        spectator.component.serviceNames[0].name,
        EtlServiceTypes.Logic,
      );

      expect(spectator.component.etlForm.controls.logicForm.controls.configuration.value).toEqual(
        fakeServices[0].configuration,
      );
    });

    it('should reset configuration control on empty service configuration', () => {
      fakeServices[3].configuration = null;
      const fakeSelected: any = {
        name: fakeServices[3].version,
      };
      spectator.detectChanges();
      spectator.component.etlForm.controls.genericDataPrepForm.controls.configuration.setValue({
        invalid: true,
      });

      spectator.component.onVersionChanged(
        fakeSelected,
        spectator.component.serviceNames[3].name,
        EtlServiceTypes.GenericDataPrep,
      );

      expect(
        spectator.component.etlForm.controls.genericDataPrepForm.controls.configuration.value,
      ).toBeNull();
    });
  });
});
