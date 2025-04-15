import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {DataLoaderClipListStatus, StateReflectorMestClipListStatus} from 'deep-ui/shared/core';
import _camelCase from 'lodash-es/camelCase';
import _startCase from 'lodash-es/startCase';

export const MEST_TO_CLIP_LIST_STATUS_OPTIONS: Array<MeSelectOption> = [
  {
    id: DataLoaderClipListStatus.VALID,
    value: _startCase(_camelCase(DataLoaderClipListStatus.VALID)),
    tooltip: 'Clips that passed the MEST step',
  },
  {
    id: DataLoaderClipListStatus.INVALID,
    value: _startCase(_camelCase(DataLoaderClipListStatus.INVALID)),
    tooltip:
      'Clips that passed in cloud-mest but were classified as invalid (e.g. itrk/pext file does not exist, itrk/pext file empty)',
  },
  {
    id: DataLoaderClipListStatus.FAILED,
    value: _startCase(_camelCase(DataLoaderClipListStatus.FAILED)),
    tooltip: 'Clips that failed in cloud-mest',
  },
];

export const NEW_FLOW_MEST_TO_CLIP_LIST_STATUS_OPTIONS: Array<MeSelectOption> = [
  {
    id: StateReflectorMestClipListStatus.VALID,
    value: _startCase(_camelCase(StateReflectorMestClipListStatus.VALID)),
    tooltip: 'Clips that passed the MEST step',
  },
  {
    id: StateReflectorMestClipListStatus.INVALID,
    value: _startCase(_camelCase(StateReflectorMestClipListStatus.INVALID)),
    tooltip:
      'Clips that passed in cloud-mest but were classified as invalid (e.g. itrk/pext file does not exist, itrk/pext file empty)',
  },
  {
    id: StateReflectorMestClipListStatus.FAILED,
    value: _startCase(_camelCase(StateReflectorMestClipListStatus.FAILED)),
    tooltip: 'Clips that failed in cloud-mest',
  },
  {
    id: StateReflectorMestClipListStatus.MEST_TRIGGER_FAILED,
    value: _startCase(_camelCase(StateReflectorMestClipListStatus.MEST_TRIGGER_FAILED)),
    tooltip: 'Clips that failed on triggering cloud-mest',
  },
];
