import {EtlTypeEnum} from './etl';

export interface EtlName {
  name: string;
  type: EtlTypeEnum;
  team: string;
  status: string;
  createdBy: string;
  createdByUsername: string;
}
