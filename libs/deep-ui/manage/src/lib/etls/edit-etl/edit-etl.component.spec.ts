import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataRetentionService, EtlJobService, EtlService, LaunchService} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum, PerfectJobFlowsEnum} from 'deep-ui/shared/models';
import {getFakeETL, getFakePerfectDatasource} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {EtlPerfectTransformFormComponent} from '../../forms/etl-forms/etl-perfect-transform-form/etl-perfect-transform-form.component';
import {EtlValidationFormComponent} from '../../forms/etl-forms/etl-validation-form/etl-validation-form.component';
import {fakeETL, fakeParsingConfigs, fakeServices} from '../view-etl/view-etl.resolver.spec';
import {EditEtlComponent} from './edit-etl.component';

const datasource1 = getFakePerfectDatasource(true, {status: 'active'}).fakeDataSource;
const datasource2 = getFakePerfectDatasource(true, {
  name: 'dataSource2',
  status: 'active',
}).fakeDataSource;
const datasource3 = getFakePerfectDatasource(true, {
  name: 'dataSource3',
  status: 'active',
}).fakeDataSource;
const fakeDataSourcesResponse = [datasource1, datasource2, datasource3];

describe('EditEtlComponent', () => {
  let spectator: Spectator<EditEtlComponent>;
  let etlService: SpyObject<EtlService>;
  let launchService: SpyObject<LaunchService>;
  let etlJobService: SpyObject<EtlJobService>;
  let dataRetentionService: SpyObject<DataRetentionService>;

  const createComponent = createComponentFactory({
    component: EditEtlComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      EtlValidationFormComponent,
      MeErrorFeedbackComponent,
      MeSelectComponent,
      EtlPerfectTransformFormComponent,
    ],
    mocks: [EtlService, LaunchService, EtlJobService, DataRetentionService],
    detectChanges: false,
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              viewData: {
                services: fakeServices,
                etl: fakeETL,
                parsingConfigs: fakeParsingConfigs,
              },
            },
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    etlService = spectator.inject(EtlService);
    etlService.getServices.and.returnValue(of(fakeServices));
    launchService = spectator.inject(LaunchService);
    etlJobService = spectator.inject(EtlJobService);
    etlJobService.getDataRetentionConfig.and.returnValue(
      of({
        [DataRetentionKnownKeysEnum.PERFECTS_DATA_SOURCE]: {
          default: 0,
          max: 1200,
          tooltip: '',
          label: '',
          job_types: [PerfectJobFlowsEnum.PERFECT_TRANSFORM],
          allowPermanent: false,
        },
      }),
    );
    dataRetentionService = spectator.inject(DataRetentionService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('fromValueChanged with Data Sources', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      etlService.create.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const etl = getFakeETL(true);
      spectator.detectChanges();

      spectator.component.onEtlFormChanged({
        etl,
        dataSources: fakeDataSourcesResponse,
        budgetGroup: 'deep',
      });

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should create etl, submit 3 jobs and redirect to perfect jobs page', () => {
      spyOn(spectator.component, 'redirectToPerfectJobs');
      const etl = getFakeETL(true);
      etlService.create.and.returnValue(of(etl));
      launchService.submitJob.and.returnValue(
        of({
          isCreated: true,
          jobUuid: 'job-id-123',
        }),
      );
      dataRetentionService.getDataRetentionConfig();
      spectator.detectChanges();

      spectator.component.onEtlFormChanged({
        etl,
        dataSources: fakeDataSourcesResponse,
        budgetGroup: 'deep',
      });

      expect(launchService.submitJob).toHaveBeenCalledTimes(3);

      expect(spectator.component.redirectToPerfectJobs).toHaveBeenCalled();
    });
  });

  describe('onEtlFormChanged no Data Sources', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      etlService.create.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const etl = getFakeETL(true);
      spectator.detectChanges();

      spectator.component.onEtlFormChanged({etl});

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should create and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      etlService.create.and.returnValue(of(null));
      const etl = getFakeETL(true);
      spectator.detectChanges();

      spectator.component.onEtlFormChanged({etl});

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });
  });
});
