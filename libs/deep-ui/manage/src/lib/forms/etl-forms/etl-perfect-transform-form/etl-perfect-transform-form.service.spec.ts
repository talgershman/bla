import {FormGroup} from '@angular/forms';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {ETL} from 'deep-ui/shared/models';
import {getFakeETL, getFakeEtlDagService, getFakeEtlServiceNames} from 'deep-ui/shared/testing';

import {EtlDiagramNode} from '../etl-form-base.service';
import {EtlPerfectTransformFormService} from './etl-perfect-transform-form.service';

const fakeDagServices = [
  getFakeEtlDagService(true, {
    type: 'perfectTransform',
    configuration: {frame_level_schema: {test: 1}, objects_level_schema: {test: 2}},
  }),
  getFakeEtlDagService(true, {type: 'other'}),
  getFakeEtlDagService(true, {type: 'dataPrep'}),
  getFakeEtlDagService(true, {
    type: 'perfectTransform',
    configuration: {frame_level_schema: {test: 5}, objects_level_schema: {test: 10}},
  }),
  getFakeEtlDagService(true, {type: 'dataPrep'}),
];

const fakeServiceNames = getFakeEtlServiceNames(fakeDagServices);

const fakeETL = getFakeETL(true, {
  team: 'deep-fpa-objects',
  servicesDag: {
    root: [fakeDagServices[3].id.toString()],
  },
  services: {
    [fakeDagServices[3].id.toString()]: fakeDagServices[3],
  },
});

describe('EtlPerfectTransformFormService', () => {
  let spectator: SpectatorService<EtlPerfectTransformFormService>;
  let service: EtlPerfectTransformFormService;

  const createService = createServiceFactory({
    service: EtlPerfectTransformFormService,
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(EtlPerfectTransformFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDiagramNodes', () => {
    it('should create correct diagram tree', () => {
      const etlForm = new FormGroup({
        rootForm: new FormGroup<any>({}),
        perfectTransformForm: new FormGroup<any>({}),
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
          id: 'perfectTransform',
          title: 'Perfect Transform',
          formGroupName: 'perfectTransformForm',
          formTemplateKey: 'perfectTransformFormTemplate',
          formGroup: etlForm.controls.perfectTransformForm as FormGroup<any>,
          warning: nodes[1].warning,
          checkError: nodes[1].checkError,
        },
      ];

      expect(nodes).toEqual(expectedResult);
    });
  });

  describe('getPerfectTransformServices', () => {
    it('should filter service names to perfect transform only', () => {
      const expectedResult = [fakeServiceNames[0], fakeServiceNames[3]];
      const perfectTransformServices = service.getPerfectTransformServices(fakeServiceNames);

      expect(perfectTransformServices).toEqual(expectedResult);
    });
  });

  describe('deSerializeEtlToFormObj', () => {
    it('should deserialize', () => {
      const obj = service.deSerializeEtlToFormObj(fakeETL);

      expect(obj.rootForm).toBeDefined();
      expect(obj.perfectTransformForm).toBeDefined();
    });
  });

  describe('serializeFormToEtlObj', () => {
    it('should serialize', () => {
      const fakeFormValue = service.deSerializeEtlToFormObj(fakeETL);
      fakeFormValue.rootForm.name = {name: fakeFormValue.rootForm.name};
      const etl: ETL = service.serializeFormToEtlObj(fakeDagServices, fakeFormValue);

      expect(etl.name).toBeDefined();
      expect(etl.servicesDag).toBeDefined();
    });
  });
});
