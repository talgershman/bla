export const RawDataOwnerTypes: Array<RawDataOwnerType> = ['ALGO', 'FPA'];

export type RawDataOwnerType = 'ALGO' | 'FPA';

export enum EtlJobRunType {
  FULL_RUN = 'full_run',
  DATA_CREATION = 'data_creation',
  COMPARE_VERSIONS = 'compare_versions',
}
