import {camelToSnake} from '@mobileye/material/src/lib/utils';
import {
  ClipList,
  ClipListTypeEnum,
  ETL,
  EtlDagService,
  EtlJob,
  EtlJobStepEnum,
  EtlName,
  EtlServiceName,
  EtlServiceTypes,
  EtlTypeEnum,
  MEST,
  ParsingConfiguration,
  StateEnum,
} from 'deep-ui/shared/models';

const _getRandString = (useRandom: boolean): any => {
  let rnd = '';
  let rndId = 1;
  if (useRandom) {
    rndId = Math.floor(1000 + Math.random() * 9000);
    rnd = rndId.toString();
  }
  return {rndId, rnd};
};

export const fakeTechnology = ['AV', 'ROAD', 'TFL'];

export const getFakeMEST = (useRandom: boolean, overrides: any = {}): MEST => {
  const {rnd, rndId} = _getRandString(useRandom);
  return {
    ...{
      id: rndId,
      group: `deep-fpa-objects`,
      rootPath: '',
      nickname: `mest${rnd}`,
      args: `some arg`,
      executables: [`executable1`, `executable2`],
      libs: [`lib1`, `lib2`],
      brainLibs: [`brainLib1`, `brainLib2`],
      params: [
        {
          key: `param1`,
          value: `value1`,
        },
      ],
      createdBy: `created by${rnd}`,
      modifiedBy: `modified By${rnd}`,
      createdAt: '2021-03-01T13:27:39.284574+00:00',
      modifiedAt: '2021-03-01T13:27:39.284574+00:00',
    },
    ...overrides,
  };
};

export const getFakeEtlJob = (convertToSnakeCase = false): EtlJob => {
  const job = {
    jobUuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
    outputPath: 'version1',
    runType: 'full_run',
    dataRetention: {
      parsed_data: '2022-09-30',
    },
    jobStatusMetadata: [
      {
        step: EtlJobStepEnum.REPORT,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.DONE,
        created: new Date('2021-03-01T13:27:39.284615+00:00'),
        details: 'Structure about guy if win attention.',
        eventCreated: new Date('2021-03-01T13:27:39.284615+00:00'),
      },
      {
        step: EtlJobStepEnum.REPORT,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.IN_PROGRESS,
        created: new Date('2021-03-01T13:27:39.284615+00:00'),
        details: 'Think bill senior agent by me baby high thousand.',
        eventCreated: new Date('2021-03-01T13:27:39.284615+00:00'),
      },
      {
        step: EtlJobStepEnum.REPORT,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.STARTED,
        created: new Date('2021-03-01T13:27:39.284185+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.284185+00:00'),
        details: 'Record end station bit former series security your along various yeah parent.',
      },
      {
        step: EtlJobStepEnum.PROBE,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.DONE,
        created: new Date('2021-03-01T13:27:39.283986+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.283986+00:00'),
        details: 'Short phone computer ground crime score.',
      },
      {
        step: EtlJobStepEnum.PROBE,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.IN_PROGRESS,
        created: new Date('2021-03-01T13:27:39.283758+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.283758+00:00'),
        details: 'Oil because radio direction open director bed budget.',
      },
      {
        step: EtlJobStepEnum.PROBE,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.STARTED,
        created: new Date('2021-03-01T13:27:39.283434+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.283434+00:00'),
        details: 'Chance late appear political professor item likely five former message.',
      },
      {
        step: EtlJobStepEnum.PARSING,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.DONE,
        created: new Date('2021-03-01T13:27:39.283154+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.283154+00:00'),
        details: 'Family ago drop first right order like approach now phone character chair.',
      },
      {
        step: EtlJobStepEnum.PARSING,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.IN_PROGRESS,
        created: new Date('2021-03-01T13:27:39.282884+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.282884+00:00'),
        details: 'Piece determine say gas human back catch officer.',
      },
      {
        step: EtlJobStepEnum.PARSING,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.STARTED,
        created: new Date('2021-03-01T13:27:39.282636+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.282636+00:00'),
        details: 'Military read state total fine expect head produce end service business.',
      },
      {
        step: EtlJobStepEnum.MEST,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.DONE,
        created: new Date('2021-03-01T13:27:39.282223+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.282223+00:00'),
        details: 'With sort conference local decide drop major why.',
      },
      {
        step: EtlJobStepEnum.MEST,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        state: StateEnum.IN_PROGRESS,
        created: new Date('2021-03-01T13:27:39.282223+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.282223+00:00'),
        details: 'Newspaper education with forget push gas or beyond always study short news west.',
      },
      {
        step: EtlJobStepEnum.MEST,
        uuid: 'e4d0f38a-7a91-11eb-8502-0242ac150005',
        created: new Date('2021-03-01T13:27:39.282223+00:00'),
        eventCreated: new Date('2021-03-01T13:27:39.282223+00:00'),
        state: StateEnum.STARTED,
        details: 'Price mean see Mrs respond different authority form become.',
      },
    ],
    jobHash: 'b06bdf4e9bf04609f8cc5cd1b26299c5',
    datasetUuid: '600a5cc6-c5f1-427b-b519-fdc597ede806',
    datasetVersion: '1.2.3',
    clipListS3Key: 'jdnlmbvdofsemcff/eqkoxwxkbpjnujme',
    probeVersion: 'V1.2.3',
    probeName: 'Christopher Thomas',
    mestVersion: '1.0.0.0',
    mestParams: 'one,two,three',
    mestArgs: "I don't know",
    mestVersionNickname: 'Kelly Rollins',
    mestHash: 'some_mest_hash',
    successThreshold: 0.95,
    userName: 'Robin',
    createdAt: '2021-03-01T15:27:39.267925+02:00',
    finishedAt: '2021-03-01T15:27:49.289817+02:00',
    status: 'done',
    fullName: 'name 1',
    duration: 10,
    tags: ['tag1', 'tag2'],
    jobType: 'type',
    probeErrors: false,
    probeLogs: false,
    metadata: '',
  } as any;
  if (convertToSnakeCase) {
    return camelToSnake(job);
  }
  return job;
};

export const getFakeClipList = (useRandom: boolean, overrides: any = {}): ClipList => {
  const {rnd, rndId} = _getRandString(useRandom);
  return {
    ...{
      id: rndId,
      name: `name-${rnd}`,
      team: `deep-fpa-objects`,
      technology: 'AV',
      type: ClipListTypeEnum.CLIP,
      brain: `brain-${rnd}`,
      camera: `camera-${rnd}`,
      count: rnd,
      tags: ['tag1', 'tag2', `tag${rnd}`],
      description: `description ${rnd}`,
      s3Path: 'some path',
      clipsToParamsHashPath: 'some-hash-path',
      createdBy: `user${rndId}`,
      modifiedBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      modifiedByUsername: `user${rndId}`,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      modifiedAt: '2021-03-01T15:27:39.267925+02:00',
    },
    ...overrides,
  };
};
export const getFakeParsingConfiguration = (
  useRandom: boolean,
  overrides: any = {},
): ParsingConfiguration => {
  const {rnd, rndId} = _getRandString(useRandom);
  return {
    ...{
      id: rndId,
      name: `name - ${rnd}`,
      version: rnd || 1,
      description: `description ${rnd}`,
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      group: `deep-fpa-objects`,
      team: `deep-fpa-objects`,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      folder: `folder-${rnd}`,
      config: {
        sub1: ['field1', 'field2'],
        sub2: ['field1', 'field2'],
      },
    },
    ...overrides,
  };
};

export const getFakeEtlDagService = (useRandom: boolean, overrides: any = {}): EtlDagService => {
  const {rnd, rndId} = _getRandString(useRandom);
  const team = `deep-fpa-objects`;
  return {
    ...{
      id: rndId,
      name: `name - ${rnd}`,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      modifiedBy: `user${rndId}`,
      modifiedAt: '2021-03-01T15:27:39.267925+02:00',
      modifiedByUsername: `user${rndId}`,
      description: `description ${rnd}`,
      team,
      type: 'probeLogic',
      version: '1.1.0master',
      sdk_version: 'Version 12.2.1',
      sdk_status: {
        status: 'warning',
        msg: 'Version 4.12.9 is warning',
      },
      configuration: {
        a: 123,
        b: true,
        c: {
          d: '123',
        },
      },
      docker_image_path: `dockerImagePath${rndId}`,
      taskDefinition: `taskDefinition${rndId}`,
    },
    ...overrides,
  };
};

export const getFakeEtlServiceNames = (
  fakeDagServices: Array<EtlDagService>,
): Array<EtlServiceName> => {
  return fakeDagServices.map((service: EtlDagService) => {
    const {name, type, team} = service;
    return {
      name,
      type,
      team,
    } as EtlServiceName;
  });
};

export const getFakeETL = (
  useRandom: boolean,
  overrides: any = {},
  type: EtlTypeEnum = EtlTypeEnum.VALIDATION,
): ETL => {
  const services = [
    getFakeEtlDagService(true, {
      id: 1,
      type: type === EtlTypeEnum.MODEL_INFERENCE ? 'genericDataPrep' : 'dataPrep',
      configuration: {
        upload_files: [],
        skip: true,
      },
    }),
    getFakeEtlDagService(true, {
      id: 2,
      type: type === EtlTypeEnum.MODEL_INFERENCE ? 'logic' : 'probeLogic',
      configuration: {
        other: true,
      },
    }),
  ];
  const {rnd, rndId} = _getRandString(useRandom);
  const team = `deep-fpa-objects`;
  if (type === EtlTypeEnum.VALIDATION || type === EtlTypeEnum.MODEL_INFERENCE) {
    const defaultData = {
      id: rndId,
      version: `version${rnd}`,
      name: `name - ${rnd}`,
      type,
      createdAt: '2021-03-01T15:27:39.267925+02:00',
      createdBy: `user${rndId}`,
      createdByUsername: `user${rndId}`,
      modifiedBy: `user${rndId}`,
      modifiedAt: '2021-03-01T15:27:39.267925+02:00',
      modifiedByUsername: `user${rndId}`,
      description: `description ${rnd}`,
      team,
      parsingConfiguration: rndId || 1,
      tags: ['tag1', 'tag2'],
      services: {
        [services[0].id]: services[0],
        [services[1].id]: services[1],
      },
      servicesDag: {
        [services[0].id]: services[1].id.toString(),
        [services[1].id]: 'BI',
        root: services[0].id.toString(),
      },
      status: `status${rndId}`,
    };
    if (type === EtlTypeEnum.MODEL_INFERENCE) {
      delete defaultData.parsingConfiguration;
    }
    return {
      ...defaultData,
      ...overrides,
    };
  }
  if (type === EtlTypeEnum.PERFECT_TRANSFORM) {
    return {
      ...{
        id: rndId,
        version: `version${rnd}`,
        name: `name - ${rnd}`,
        type: EtlTypeEnum.PERFECT_TRANSFORM,
        createdAt: '2021-03-01T15:27:39.267925+02:00',
        createdBy: `user${rndId}`,
        createdByUsername: `user${rndId}`,
        modifiedBy: `user${rndId}`,
        modifiedAt: '2021-03-01T15:27:39.267925+02:00',
        modifiedByUsername: `user${rndId}`,
        description: `description ${rnd}`,
        team,
        tags: ['tag1', 'tag2'],
        services: {
          1: {
            name: 'perfectService_1',
            type: EtlTypeEnum.PERFECT_TRANSFORM,
            configuration: {
              frame_level_schema: {
                // frames
                someProp: true,
              },
              object_level_schema: {
                // objects
                otherProp: false,
              },
              params: {
                temp: 1,
              },
            },
          },
        },
        servicesDag: {
          root: '1',
        },
        status: `status${rndId}`,
      },
      ...overrides,
    };
  }
  return null;
};

export const getFakeEtlNames = (fakeEtls: Array<ETL>): Array<EtlName> => {
  return fakeEtls.map((etl: ETL) => {
    const {name, type, team, status, createdByUsername} = etl;
    return {
      name,
      type,
      team,
      status,
      createdByUsername,
    } as EtlName;
  });
};

export const getFakeETLDataPrepOrGenericDataPrepOnly = (
  useRandom: boolean,
  overrides: any = {},
  serviceType: EtlServiceTypes = EtlServiceTypes.DataPrep,
): ETL => {
  const services = {
    1: getFakeEtlDagService(true, {
      id: 1,
      type: serviceType,
      configuration: {
        upload_files: [],
        skip: true,
      },
    }),
  };
  const servicesDag = {
    [services[1].id]: 'BI',
    root: services[1].id.toString(),
  };
  return getFakeETL(useRandom, {
    servicesDag,
    services,
    ...overrides,
  });
};
