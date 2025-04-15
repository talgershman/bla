import {PerfectList, PerfectListTypeEnum} from 'deep-ui/shared/models';

export const getFakePerfectList = (useRandom: boolean, overrides: any = {}): PerfectList => {
  const {rnd, rndId} = _getRandString(useRandom);
  return {
    ...{
      id: rndId,
      name: `name-${rnd}`,
      team: `deep-fpa-objects`,
      type: PerfectListTypeEnum.DIRECTORY,
      technology: 'AV',
      rawDataOwner: 'ALGO',
      locationsOnMobileye: ['/mobileye/Perfects/PerfectResults/'],
      s3Path: 's3Path1',
      count: rnd,
      tags: ['tag1', 'tag2', `tag${rnd}`],
      description: `description ${rnd}`,
      status: 'active',
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

const _getRandString = (useRandom: boolean): any => {
  let rnd = '';
  let rndId = 1;
  if (useRandom) {
    rndId = Math.floor(1000 + Math.random() * 9000);
    rnd = rndId.toString();
  }
  return {rndId, rnd};
};
