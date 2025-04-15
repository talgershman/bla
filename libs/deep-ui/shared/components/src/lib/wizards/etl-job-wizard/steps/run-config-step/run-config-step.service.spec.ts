import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator';
import {DatasourceService, EtlJobService, JobFormBuilderService} from 'deep-ui/shared/core';
import {getFakeETL, getFakePerfectDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {RunConfigStepService} from './run-config-step.service';

const {fakeDataSource} = getFakePerfectDatasource(true);

describe('RunConfigStepService', () => {
  let spectator: SpectatorService<RunConfigStepService>;
  let etlJobService: SpyObject<EtlJobService>;

  const createService = createServiceFactory({
    service: RunConfigStepService,
    mocks: [JobFormBuilderService, DatasourceService, EtlJobService],
  });

  beforeEach((): void => {
    spectator = createService();
    etlJobService = spectator.inject(EtlJobService);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('generateDataSourceOptions', () => {
    it('should return empty array when the data source if not versioned', () => {
      const result = spectator.service.generateDataSourceOptions({
        ...fakeDataSource,
        versioned: false,
      });

      expect(result.length).toEqual(0);
    });

    it('should return empty array when the data source doesnt have versions_set', () => {
      const result = spectator.service.generateDataSourceOptions({
        ...fakeDataSource,
        datasourceversionSet: [],
      });

      expect(result.length).toEqual(0);
    });

    it('should return all the datasource versions + latest', () => {
      const result = spectator.service.generateDataSourceOptions(fakeDataSource);

      expect(result.length).toEqual(fakeDataSource.datasourceversionSet?.length + 1);
    });
  });

  describe('getPreviewOutputPath', () => {
    it('missing mandatory inputs - return empty string', () => {
      const fakeETL = getFakeETL(true);

      const result = spectator.service.getPreviewOutputPath(fakeETL, '', '');

      expect(result).toBe('');
    });

    it('should return a preview string', () => {
      const fakeETL = getFakeETL(true);

      const result = spectator.service.getPreviewOutputPath(fakeETL, 'deep-fpa-objects', 'output1');

      expect(result).toBe(
        `<span>Your ETL results will be saved at:</span><br><span>s3://mobileye-deep.bi-reports.prod1/fpa/objects/${fakeETL.name}/${fakeETL.services[1].name}/&lt;classifier name from the ETL code&gt;/<b>output1</b>/&lt;job_uuid&gt;</span>`,
      );
    });
  });

  describe('getOutputPathSuggestions', () => {
    it('should return an empty array when etl not provided', (done) => {
      spectator.service.getOutputPathSuggestions(null, 'test-team').subscribe((suggestions) => {
        expect(suggestions).toEqual([]);
        done();
      });
    });

    it('should return an empty array when team not provided', (done) => {
      spectator.service
        .getOutputPathSuggestions({name: 'test-etl'} as any, null)
        .subscribe((suggestions) => {
          expect(suggestions).toEqual([]);
          done();
        });
    });

    it('no last output - should return one suggestion of options', (done) => {
      etlJobService.getLastOutputPath.and.returnValue(of({path: ''}));
      spectator.service
        .getOutputPathSuggestions({name: 'test-etl'} as any, 'team-1')
        .subscribe((suggestions) => {
          expect(suggestions).toEqual([{value: '1.0.0', label: 'Versioned: 1.0.0'}]);
          done();
        });
    });

    it('last output - format is not versioned - should return versions suggestions', (done) => {
      etlJobService.getLastOutputPath.and.returnValue(of({path: 'some-text'}));
      spectator.service
        .getOutputPathSuggestions({name: 'test-etl'} as any, 'team-1')
        .subscribe((suggestions) => {
          expect(suggestions).toEqual([
            {
              value: 'some-text',
              label: 'Previous: some-text',
            },
            {
              value: 'some-text_1.0.0',
              label: 'Versioned: some-text_1.0.0',
            },
            {
              value: '1.0.0',
              label: 'Versioned short: 1.0.0',
            },
          ]);
          done();
        });
    });

    it('last output - format is not versioned with a suffix - should return versions suggestions', (done) => {
      etlJobService.getLastOutputPath.and.returnValue(of({path: 'some-text_'}));
      spectator.service
        .getOutputPathSuggestions({name: 'test-etl'} as any, 'team-1')
        .subscribe((suggestions) => {
          expect(suggestions).toEqual([
            {
              value: 'some-text_',
              label: 'Previous: some-text_',
            },
            {
              value: 'some-text_1.0.0',
              label: 'Versioned: some-text_1.0.0',
            },
            {
              value: '1.0.0',
              label: 'Versioned short: 1.0.0',
            },
          ]);
          done();
        });
    });

    it('last output - format is versioned - should return bump suggestions', (done) => {
      etlJobService.getLastOutputPath.and.returnValue(of({path: 'some-text-1.3.5'}));
      spectator.service
        .getOutputPathSuggestions({name: 'test-etl'} as any, 'team-1')
        .subscribe((suggestions) => {
          expect(suggestions).toEqual([
            {
              value: 'some-text-1.3.5',
              label: 'Previous: some-text-1.3.5',
            },
            {
              value: 'some-text-2.0.0',
              label: 'Major: some-text-2.0.0',
            },
            {
              value: 'some-text-1.4.0',
              label: 'Minor: some-text-1.4.0',
            },
            {
              value: 'some-text-1.3.6',
              label: 'Patch: some-text-1.3.6',
            },
          ]);
          done();
        });
    });

    it('last output - format is short versioned - should return bump suggestions', (done) => {
      etlJobService.getLastOutputPath.and.returnValue(of({path: '1.0.0'}));
      spectator.service
        .getOutputPathSuggestions({name: 'test-etl'} as any, 'team-1')
        .subscribe((suggestions) => {
          expect(suggestions).toEqual([
            {
              value: '1.0.0',
              label: 'Previous: 1.0.0',
            },
            {
              value: '2.0.0',
              label: 'Major: 2.0.0',
            },
            {
              value: '1.1.0',
              label: 'Minor: 1.1.0',
            },
            {
              value: '1.0.1',
              label: 'Patch: 1.0.1',
            },
          ]);
          done();
        });
    });
  });
});
