import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {of} from 'rxjs';

import {EtlDiagramNode} from '../etl-form-base.service';
import {EtlPerfectTransformFormComponent} from './etl-perfect-transform-form.component';
import {EtlPerfectTransformFormService} from './etl-perfect-transform-form.service';
import SpyObj = jasmine.SpyObj;
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {BudgetGroupControl} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {EtlService} from 'deep-ui/shared/core';
import {EtlDagService, EtlServiceName, EtlServiceTypes, EtlTypeEnum} from 'deep-ui/shared/models';
import {getFakeETL, getFakeEtlDagService, getFakeEtlServiceNames} from 'deep-ui/shared/testing';

export const fakeServices = [
  getFakeEtlDagService(true),
  getFakeEtlDagService(true, {type: 'perfectTransform', version: '1.1.1master'}),
  getFakeEtlDagService(true, {version: '1.2.dev'}),
  getFakeEtlDagService(true, {type: 'perfectTransform', version: '1.4.dev'}),
];

export const fakeServiceNames = getFakeEtlServiceNames(fakeServices);

export const fakeETL = getFakeETL(true, {
  team: 'deep-fpa-objects',
  servicesDag: {
    root: [fakeServices[1].id.toString()],
  },
  services: {
    [fakeServices[1].id.toString()]: fakeServices[1],
  },
  sdkStatus: {
    status: 'warning',
    msg: 'Version 4.12.9 is warning',
  },
});

describe('EtlPerfectTransformFormComponent', () => {
  let spectator: Spectator<EtlPerfectTransformFormComponent>;
  let etlService: SpyObj<EtlService>;

  const createComponent = createComponentFactory({
    component: EtlPerfectTransformFormComponent,
    imports: [
      MatButtonModule,
      ReactiveFormsModule,
      MeInputComponent,
      MeTextareaComponent,
      MeSelectComponent,
      MeAutocompleteComponent,
      MatIconModule,
      MeTooltipDirective,
      MeFormControlChipsFieldComponent,
      MeJsonEditorComponent,
      MatCheckboxModule,
      MatSlideToggleModule,
      BudgetGroupControl,
      HintIconComponent,
      MeSafePipe,
      NgTemplateOutlet,
      AsyncPipe,
    ],
    providers: [EtlPerfectTransformFormService],
    mocks: [EtlService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    etlService = spectator.inject(EtlService);
    etlService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    spectator.component.serviceNames = fakeServiceNames;
    spectator.component.etl = fakeETL;
    spectator.component.type = EtlTypeEnum.PERFECT_TRANSFORM;
    etlService.getServices.and.returnValue(
      of(
        fakeServices.filter(
          (service: EtlDagService) =>
            service.name ===
              spectator.component.etl.services[spectator.component.etl.servicesDag.root].name &&
            service.type === EtlServiceTypes.PerfectTransform,
        ),
      ),
    );
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
        formGroupName: 'rootForm',
        formGroup: new FormGroup<any>({a: new FormControl()}),
        formTemplateKey: 'perfectTransformFormTemplate',
      };
      const fakeDiv = document.createElement('div');
      spectator.detectChanges();

      spectator.component.onNodeClicked(fakeNode, fakeDiv);

      expect(spectator.component.selectedNode).toEqual(fakeNode);
      expect(spectator.component.selectNodeTemplate).toEqual(
        spectator.component.perfectTransformFormTemplate,
      );
    });
  });

  describe('onVersionChanged', () => {
    it('should set schemas', () => {
      const fakeSelected: any = {
        name: fakeServices[1].version,
      };

      spectator.detectChanges();

      spectator.component.onVersionChanged(
        fakeSelected,
        spectator.component.serviceNames.filter(
          (serviceName: EtlServiceName) => serviceName.type === EtlServiceTypes.PerfectTransform,
        )[0].name,
        EtlServiceTypes.PerfectTransform,
      );

      expect(
        spectator.component.etlForm.controls.perfectTransformForm.controls.configuration.value,
      ).toEqual(spectator.component.selectedPerfectTransformServices[0].configuration);
    });
  });
});
