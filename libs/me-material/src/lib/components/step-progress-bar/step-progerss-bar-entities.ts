export enum MeStepProgressEnum {
  DONE = 'DONE',
  FAILED = 'FAILED',
  NOT_STARTED = 'NOTSTARTED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export interface MeStepDef {
  progress: MeStepProgressEnum;
}
