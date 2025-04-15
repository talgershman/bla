export enum MeParametersListItemType {
  SINGLE = 'single',
  KEY_VALUE = 'key-value',
}

export interface MeParametersListItem {
  key: string;
  type: MeParametersListItemType;
  value?: string;
}
