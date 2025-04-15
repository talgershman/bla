import {FormGroup} from '@angular/forms';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {ETL} from 'deep-ui/shared/models';
import {
  getFakeETL,
  getFakeEtlDagService,
  getFakeEtlServiceNames,
  getFakeParsingConfiguration,
} from 'deep-ui/shared/testing';

import {EtlDiagramNode} from '../etl-form-base.service';
import {EtlValidationFormService} from './etl-validation-form.service';

const fakeDagServices = [
  getFakeEtlDagService(true, {type: 'probeLogic'}),
  getFakeEtlDagService(true, {type: 'other'}),
  getFakeEtlDagService(true, {type: 'dataPrep'}),
  getFakeEtlDagService(true, {type: 'probeLogic'}),
  getFakeEtlDagService(true, {type: 'dataPrep'}),
];

const fakeServiceNames = getFakeEtlServiceNames(fakeDagServices);

const fakeParsingConfigs = [
  getFakeParsingConfiguration(true),
  getFakeParsingConfiguration(true),
  getFakeParsingConfiguration(true),
];

const fakeETL = getFakeETL(true, {
  team: 'deep-fpa-objects',
  parsingConfiguration: fakeParsingConfigs[0].id,
  services: {
    [fakeDagServices[2].id.toString()]: fakeDagServices[2],
    [fakeDagServices[0].id.toString()]: fakeDagServices[0],
  },
  servicesDag: {
    root: [fakeDagServices[2].id.toString()],
    [fakeDagServices[2].id]: [fakeDagServices[0].id.toString()],
    [fakeDagServices[0].id]: ['BI'],
  },
});

const fakeAllETLs = [
  fakeETL,
  getFakeETL(true, {
    name: 'zzz-probe-1',
  }),
  getFakeETL(true, {
    name: 'zzz-probe-2',
  }),
];

describe('EtlValidationFormService', () => {
  let spectator: SpectatorService<EtlValidationFormService>;
  let service: EtlValidationFormService;

  const createService = createServiceFactory({
    service: EtlValidationFormService,
    mocks: [ParsingConfigurationService],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(EtlValidationFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDiagramNodes', () => {
    it('should create correct diagram tree', () => {
      const etlForm = new FormGroup<any>({
        rootForm: new FormGroup<any>({}),
        dataPrepForm: new FormGroup<any>({}),
        probeLogicForm: new FormGroup<any>({}),
      });

      const nodes = service.getDiagramNodes(etlForm);

      const expectedResult: Array<EtlDiagramNode> = [
        {
          id: 'root',
          title: 'Root',
          formGroupName: 'rootForm',
          formGroup: etlForm.controls.rootForm as FormGroup<any>,
          formTemplateKey: 'rootFormTemplate',
        },
        {
          id: 'dataPrep',
          title: 'Data Prep',
          formGroupName: 'dataPrepForm',
          formTemplateKey: 'dataPrepFormTemplate',
          formGroup: etlForm.controls.dataPrepForm as FormGroup<any>,
          warning: nodes[1].warning,
          checkError: nodes[1].checkError,
        },
        {
          id: 'probeLogic',
          title: 'ETL Logic',
          formGroupName: 'probeLogicForm',
          formTemplateKey: 'probeLogicFormTemplate',
          formGroup: etlForm.controls.probeLogicForm as FormGroup<any>,
          warning: nodes[2].warning,
          checkError: nodes[2].checkError,
          showDelete: true,
        },
      ];

      expect(nodes).toEqual(expectedResult);
    });
  });

  describe('getEtlLogicServices', () => {
    it('should filter services to etl logic only', () => {
      const expectedResult = [fakeServiceNames[0], fakeServiceNames[3]];
      const etlLogics = service.getEtlLogicServices(fakeServiceNames);

      expect(etlLogics).toEqual(expectedResult);
    });
  });

  describe('getDataPrepServices', () => {
    it('should filter services to data prep only', () => {
      const expectedResult = [fakeServiceNames[2], fakeServiceNames[4]];
      const dataPreps = service.getDataPrepServices(fakeServiceNames);

      expect(dataPreps).toEqual(expectedResult);
    });
  });

  describe('deSerializeEtlToFormObj', () => {
    it('should deserialize', () => {
      const obj = service.deSerializeEtlToFormObj(fakeAllETLs[0]);

      expect(obj.rootForm).toBeDefined();
      expect(obj.dataPrepForm).toBeDefined();
      expect(obj.probeLogicForm).toBeDefined();
    });
  });

  describe('serializeFormToEtlObj', () => {
    it('should serialize', () => {
      const fakeFormValue = service.deSerializeEtlToFormObj(fakeAllETLs[0]);
      fakeFormValue.rootForm.name = {name: fakeFormValue.rootForm.name};
      fakeFormValue.rootForm.parsingConfiguration = {
        id: fakeFormValue.rootForm.parsingConfiguration,
      };
      const etl: ETL = service.serializeFormToEtlObj(fakeDagServices, fakeFormValue);

      expect(etl.name).toBeDefined();
      expect(etl.servicesDag).toBeDefined();
    });
  });
});
