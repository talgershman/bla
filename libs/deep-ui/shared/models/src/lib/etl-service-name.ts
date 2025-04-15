export enum EtlServiceTypes {
  DataPrep = 'dataPrep',
  ProbeLogic = 'probeLogic',
  PerfectTransform = 'perfectTransform',
  GenericDataPrep = 'genericDataPrep',
  Logic = 'logic',
}

export interface EtlServiceName {
  name: string;
  type: EtlServiceTypes;
  team: string;
}
