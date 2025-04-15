import {
  Dataset,
  Datasource,
  ETL,
  EtlTypeEnum,
  MestDatasourceGroup,
  PerfectList,
  QEAttribute,
  VersionDataSource,
} from 'deep-ui/shared/models';

import {getFakeETL} from './fake-entities';
import {getFakePerfectList} from './fake-entities-perfect-list';

export const getFakePerfectDatasource = (
  useRandom: boolean,
  overrides: any = {},
): {
  fakeDataSource: Datasource;
  fakePerfectList: PerfectList;
  fakeVersionDataSource: VersionDataSource;
  fakeETL: ETL;
} => {
  const fakeVersionDataSource = getFakeVersionDataSource(true);
  const fakePerfectList = getFakePerfectList(true);
  const fakeETL = getFakeETL(true, {}, EtlTypeEnum.PERFECT_TRANSFORM);

  const {rnd, rndId} = _getRandString(useRandom);
  const fakeDataSource = {
    ...{
      id: `id - ${rnd}`,
      modifiedAt: '2021-03-01T15:27:39.267925+02:00',
      datasourceversionSet: [fakeVersionDataSource],
      name: `name-${rnd}`,
      team: `deep-fpa-objects`,
      status: 'active',
      siblingsId: [],
      technology: `VD`,
      rawDataOwner: 'ALGO',
      dataType: `perfects`,
      dataSubType: 'frames',
      numberOfClips: 103,
      tags: [],
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      modifiedBy: `user${rndId}`,
      modifiedByUsername: `user${rndId}`,
      allowAggregation: true,
      versioned: true,
      latestUserVersion: fakeVersionDataSource.userFacingVersion,
      tableName: 'table1',
      allowedSubTypes: ['frames'],
      perfectListIds: [fakePerfectList.id],
      jobIds: ['job1'],
      s3Path: 'some-path',
      etlId: fakeETL.id,
      etlName: fakeETL.name,
      frameIndicators: ['gfi'],
      description: '',
      datasourceVirtualUrl:
        'deep://perfects/data-source-uuid=f5ccc670-cc4a-4323-acac-3355df861f11/env=dev1/?name=test clissify perfect by rq',
    },
    ...overrides,
  };

  return {
    fakePerfectList,
    fakeVersionDataSource,
    fakeDataSource,
    fakeETL,
  };
};

export const getFakeDeSearchDataSource = (): Datasource => {
  return {
    id: '49f6f650-e292-5223-ab69-ce7ce23425ac',
    modifiedAt: '2023-06-14T02:20:17.799908+03:00',
    datasourceversionSet: [],
    name: 'DESearchClips',
    team: '-',
    status: 'active',
    siblingsId: null,
    technology: '-',
    rawDataOwner: '-',
    dataType: 'clips',
    dataSubType: null,
    numberOfClips: 29861950,
    tags: null,
    createdBy: 'deep-admin',
    createdByUsername: '',
    createdAt: '2022-12-13T17:47:54.523882+02:00',
    modifiedBy: 'deep-admin',
    modifiedByUsername: '',
    allowAggregation: false,
    versioned: false,
    latestUserVersion: null,
    allowedSubTypes: ['frames', 'objects'],
    perfectListIds: null,
    jobIds: null,
    etlId: 0,
    frameIndicators: [],
    description: null,
    expirationDate: '2023-02-13T17:47:54.523882+02:00',
    datasourceVirtualUrl: '',
  };
};

export const getFakeMestDatasourceGroup = (
  useRandom: boolean,
  overrides: any = {},
): {fakeMestDatasourceGroup: MestDatasourceGroup} => {
  const {rnd} = _getRandString(useRandom);
  const fakeMestDatasourceGroup = {
    ...{
      jobId: `job - ${rnd}`,
      sampleDataSourceId: `sample - ${rnd}`,
      team: `deep-fpa-objects`,
      expirationDate: '2024-03-18',
      childCount: 4,
    },
    ...overrides,
  };

  return {
    fakeMestDatasourceGroup,
  };
};

export const getFakeMestDatasource = (
  useRandom: boolean,
  overrides: any = {},
): {fakeDataSource: Datasource} => {
  const {rnd, rndId} = _getRandString(useRandom);
  const fakeDataSource = {
    ...{
      id: `id - ${rnd}`,
      modifiedAt: '2021-03-01T15:27:39.267925+02:00',
      datasourceversionSet: [],
      name: `name-${rnd}`,
      team: `deep-fpa-objects`,
      status: 'active',
      siblingsId: null,
      technology: `-`,
      rawDataOwner: 'ALGO',
      dataType: `itrks`,
      dataSubType: 'frames',
      numberOfClips: 0,
      tags: null,
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      modifiedBy: `user${rndId}`,
      modifiedByUsername: `user${rndId}`,
      allowAggregation: false,
      versioned: false,
      latestUserVersion: null,
      tableName: 'table1',
      allowedSubTypes: ['frames'],
      perfectListIds: null,
      jobIds: ['job1'],
      s3Path: 'some-path',
      etlId: 0, //always 0 because there is no ETL, only parsing configuration
      etlName: 'Data Creation',
      frameIndicators: ['gfi'],
      description: null,
      datasourceVirtualUrl:
        'deep://mest/data-source-uuid=f5ccc670-cc4a-4323-acac-3355df861f11/env=dev1/?name=test mest',
    },
    ...overrides,
  };

  return {
    fakeDataSource,
  };
};

export const getEtlResultsDatasource = (
  useRandom: boolean,
  overrides: any = {},
): {fakeDataSource: Datasource; fakeETL: ETL} => {
  const {rnd, rndId} = _getRandString(useRandom);
  const fakeETL = getFakeETL(true, {}, EtlTypeEnum.VALIDATION);

  const fakeDataSource = {
    ...{
      id: `id - ${rnd}`,
      createdAt: '2030-11-25T10:27:22.405525+03:00',
      datasourceversionSet: [],
      name: `name-${rnd}`,
      team: `deep-fpa-objects`,
      status: 'active',
      siblingsId: null,
      technology: `-`,
      rawDataOwner: 'ALGO',
      dataType: `etl_results`,
      dataSubType: 'frames',
      numberOfClips: 10,
      tags: null,
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      modifiedAt: '2030-11-25T10:27:22.405525+03:00',
      modifiedBy: `user${rndId}`,
      modifiedByUsername: `user${rndId}`,
      allowAggregation: false,
      versioned: false,
      latestUserVersion: null,
      tableName: 'table1',
      allowedSubTypes: ['frames'],
      perfectListIds: null,
      jobIds: ['job1'],
      s3Path: 'some-path',
      etlId: fakeETL.id,
      etlName: `name - ${rndId}`,
      frameIndicators: ['gfi'],
      description: null,
      nickname: `nickname${rndId}`,
      datasourceVirtualUrl:
        'deep://etl_results/data-source-uuid=f5ccc670-cc4a-4323-acac-3355df861f11/env=dev1/?name=test etl results',
    },
    ...overrides,
  };
  return {
    fakeDataSource,
    fakeETL,
  };
};

export const getFakeSimulatorDatasource = (
  useRandom: boolean,
  overrides: any = {},
): {
  fakeDataSource: Datasource;
  fakeVersionDataSource: VersionDataSource;
} => {
  const {rnd} = _getRandString(useRandom);
  const dataSourceId = `id - ${rnd}`;
  const fakeVersionDataSource = getFakeSimulatorVersionDataSource(true, {dataSource: dataSourceId});
  const fakeDataSource = {
    ...{
      id: dataSourceId,
      modifiedAt: '2021-03-01T15:27:39.267925+02:00',
      datasourceversionSet: [fakeVersionDataSource],
      name: `name-${rnd}`,
      team: `deep-fpa-objects`,
      status: 'active',
      siblingsId: [],
      technology: `-`,
      rawDataOwner: '-',
      dataType: `simulator`,
      dataSubType: 'frames',
      numberOfClips: 30,
      tags: [],
      createdBy: '-',
      createdByUsername: ``,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      modifiedBy: `-`,
      modifiedByUsername: ``,
      allowAggregation: true,
      versioned: true,
      latestUserVersion: fakeVersionDataSource.userFacingVersion,
      tableName: 'table1',
      allowedSubTypes: ['frames'],
      perfectListIds: null,
      jobIds: [],
      s3Path: null,
      etlId: null,
      etlName: null,
      frameIndicators: ['frame_id', 'grab_index'],
      description: null,
    },
    ...overrides,
  };

  return {
    fakeVersionDataSource,
    fakeDataSource,
  };
};

export const getFakeOfficialDriveDatasource = (
  useRandom: boolean,
  overrides: any = {},
): Datasource => {
  const {rnd} = _getRandString(useRandom);

  return {
    ...{
      id: '49f6f650-e292-5223-ab69-ce7ce23425ac',
      modifiedAt: '2023-06-14T02:20:17.799908+03:00',
      datasourceversionSet: [],
      name: `name-${rnd}`,
      team: '-',
      status: 'active',
      siblingsId: null,
      technology: '-',
      rawDataOwner: '-',
      dataType: 'clips',
      dataSubType: null,
      numberOfClips: 1,
      tags: null,
      createdBy: 'deep-admin',
      createdByUsername: '',
      createdAt: '2022-12-13T17:47:54.523882+02:00',
      modifiedBy: 'deep-admin',
      modifiedByUsername: '',
      allowAggregation: false,
      versioned: false,
      latestUserVersion: null,
      allowedSubTypes: ['frames'],
      perfectListIds: null,
      jobIds: null,
      etlId: 0,
      frameIndicators: [],
      description: null,
      expirationDate: '2023-02-13T17:47:54.523882+02:00',
      datasourceVirtualUrl: '',
    },
    ...overrides,
  };
};

export const getFakeVersionDataSource = <T extends VersionDataSource>(
  useRandom: boolean,
  overrides: any = {},
): T => {
  const {rnd, rndId} = _getRandString(useRandom);
  return {
    ...{
      id: `id - ${rnd}`,
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      status: 'active',
      userFacingVersion: '1',
      numberOfClips: 0,
      jobId: 'job1',
      etlId: 'probeVersion1',
      perfectListIds: [],
      description: '',
      tags: [],
      dataSourceId: '',
      datasourceVirtualUrl:
        'deep://perfects/data-source-uuid=be14b332-03c1-49bf-a8a2-10d2b3d84040/version=1/env=dev1/?name=user_params_from_client_112_elad',
    },
    ...overrides,
  };
};

export const getFakeSimulatorVersionDataSource = <T extends VersionDataSource>(
  useRandom: boolean,
  overrides: any = {},
): T => {
  const {rnd} = _getRandString(useRandom);
  return {
    ...{
      id: `id - ${rnd}`,
      createdBy: `-`,
      createdByUsername: null,
      status: 'active',
      userFacingVersion: '1',
      numberOfClips: 2,
      jobId: null,
      etlId: null,
      perfectListIds: null,
      description: null,
      tags: null,
      dataSourceId: '',
    },
    ...overrides,
  };
};

export const getFakeGoldenLabelsDataSource = <T extends Datasource>(
  useRandom: boolean,
  overrides: any = {},
): T => {
  const fakeVersionDataSource = getFakeVersionDataSource(true);
  const {rnd, rndId} = _getRandString(useRandom);
  const fakeDataSource = {
    ...{
      id: `id - ${rnd}`,
      modifiedAt: '2021-03-01T15:27:39.267925+02:00',
      datasourceversionSet: [fakeVersionDataSource],
      name: `name-${rnd}`,
      team: `deep-fpa-objects`,
      status: 'active',
      dataType: `golden_labels`,
      dataSubType: 'frames',
      numberOfClips: 103,
      tags: [],
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      modifiedBy: `user${rndId}`,
      modifiedByUsername: `user${rndId}`,
      allowAggregation: true,
      versioned: true,
      latestUserVersion: fakeVersionDataSource.userFacingVersion,
      tableName: 'table1',
      allowedSubTypes: ['frames'],
      jobIds: [],
      s3Path: 'some-path',
      frameIndicators: ['gfi'],
      description: '',
      datasourceVirtualUrl:
        'deep://golden-labels/data-source-uuid=f5ccc670-cc4a-4323-acac-3355df861f11/env=dev1/?name=test clissify perfect by rq',
    },
    ...overrides,
  };
  return fakeDataSource;
};

export const getFakeDataset = (
  useRandom: boolean,
  dataSource?: Datasource,
  overrides: any = {},
): Dataset => {
  const fakeDatasource = dataSource || getFakePerfectDatasource(true).fakeDataSource;
  const {rnd, rndId} = _getRandString(useRandom);
  return {
    ...{
      id: rnd,
      name: `name - ${rnd}`,
      status: 'active',
      team: `deep-fpa-objects`,
      description: `description ${rnd}`,
      queryJson: getFakeQueryJson(fakeDatasource.id),
      queryString: 'some sql query',
      pathOnS3: `pathOnS3-${rnd}`,
      numberOfClips: 1235456,
      allowJumpFile: false,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      modifiedBy: `user${rndId}`,
      modifiedAt: '2021-03-01T15:27:39.267925+02:00',
      modifiedByUsername: `user${rndId}`,
      expirationDate: '2024-09-18',
      source: 'query_engine',
    },
    ...overrides,
  };
};

export const fakeIntegerQEAttribute = (): QEAttribute => {
  return {
    columnName: 'integer',
    columnType: 'integer',
    values: null,
  };
};

export const fakeFloatQEAttribute = (): QEAttribute => {
  return {
    columnName: 'double',
    columnType: 'double',
    values: null,
  };
};

export const fakeStringWithValuesQEAttribute = (): QEAttribute => {
  return {
    columnName: 'string_with_values',
    columnType: 'string',
    values: [
      'some',
      'bla',
      'bla1',
      'bla2',
      'bla2 zzz',
      'bladfgjkldfjglkdf jglkfdjglkdfjglkj fdlkgjfdlkgjfdg',
    ],
  };
};

export const fakeStringNoValuesQEAttribute = (): QEAttribute => {
  return {
    columnName: 'string_no_value',
    columnType: 'string',
    values: null,
  };
};

export const fakeBooleanQEAttribute = (): QEAttribute => {
  return {
    columnName: 'bool',
    columnType: 'boolean',
    values: null,
  };
};

export const fakeStringArrayQEAttribute = (): QEAttribute => {
  return {
    columnName: 'string_array',
    columnType: 'array<string>',
    values: ['some', 'bla2 zzz', 'bladjglkdfjglkj fdlkgjfdlkgjfdg'],
  };
};

export const fakeUnknownQEAttribute = (): QEAttribute => {
  return {
    columnName: 'unknown type',
    columnType: 'unknown',
    values: {bla: true} as any,
  };
};

export const getFakeQEAttributes = (): Array<QEAttribute> => {
  return [
    fakeStringNoValuesQEAttribute(),
    fakeStringWithValuesQEAttribute(),
    fakeIntegerQEAttribute(),
    fakeBooleanQEAttribute(),
    fakeFloatQEAttribute(),
    fakeStringArrayQEAttribute(),
    fakeUnknownQEAttribute(),
  ];
};

const _getRandString = (useRandom: boolean): any => {
  let rnd = '';
  let rndId = 1;
  if (useRandom) {
    rndId = Math.floor(1000 + Math.random() * 9000);
    rnd = rndId.toString();
  }
  return {rndId, rnd};
};

export const getFakeQueryJson = (
  dataSourceId?: string,
  useRandom?: boolean,
  cols?: Array<string>,
): any => {
  const {rnd} = _getRandString(useRandom);
  return [
    {
      query: {
        columns: cols || [],
        conditions: {
          condition: 'AND',
          rules: [
            {
              key: 'bool',
              operator: 'equal',
              value: 'true',
              type: 'boolean',
            },
            {
              key: 'bool',
              operator: 'not_equal',
              value: 'false',
              type: 'boolean',
            },
            {
              key: 'bool',
              operator: 'is_null',
              value: null,
              type: 'boolean',
            },
            {
              key: 'bool',
              operator: 'is_not_null',
              value: null,
              type: 'boolean',
            },
            {
              key: 'double',
              operator: 'equal',
              value: '1234.54',
              type: 'double',
            },
            {
              key: 'double',
              operator: 'less',
              value: '453',
              type: 'double',
            },
            {
              key: 'double',
              operator: 'greater',
              value: '345',
              type: 'double',
            },
            {
              key: 'string_no_value',
              operator: 'not_equal',
              value: '45345',
              type: 'string',
            },
            {
              key: 'string_no_value',
              operator: 'in',
              value: ['dbe', 'abc'],
              type: 'string',
            },
            {
              key: 'string_no_value',
              operator: 'is_null',
              value: null,
              type: 'string',
            },
            {
              key: 'string_no_value',
              operator: 'is_not_null',
              value: null,
              type: 'string',
            },
            {
              key: 'string_with_values',
              operator: 'equal',
              value: 'bla2',
              type: 'string',
            },
          ],
        },
      },
      dataSourceId: dataSourceId || `some-id=${rnd}`,
    },
  ];
};
