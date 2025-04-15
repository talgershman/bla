import {MeGroupButton} from '@mobileye/material/src/lib/common';
import {EtlJobFlowsEnum} from 'deep-ui/shared/models';

export const flowButtons: MeGroupButton[] = [
  {
    id: EtlJobFlowsEnum.VERSION_PERFECT,
    label: `Version + Perfect`,
  },
  {
    id: EtlJobFlowsEnum.SINGLE_VERSION,
    label: 'Single Version',
  },
  {
    id: EtlJobFlowsEnum.CLIP_2_LOG,
    label: 'Clip2log',
  },
  {
    id: EtlJobFlowsEnum.AV_PIPELINE,
    label: 'AV Pipeline',
  },
  // {
  //   id: EtlJobFlowsEnum.PC_RUN,
  //   label: 'PC run',
  // },
  {
    id: EtlJobFlowsEnum.CLOUD_MCO,
    label: 'Cloud MCO',
  },
  {
    id: EtlJobFlowsEnum.METRO,
    label: 'METRO',
  },
];

export type MeConfigurationTab = {key: string; tabIndex: number};

export const CONFIGURATION_KEYS_OF_ALLOW_ON_NEXT_TAB: MeConfigurationTab[] = [
  {
    key: 'upload_files',
    tabIndex: 1,
  },
];
