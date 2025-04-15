export interface MeFieldConfig {
  label: string;
  name: string;
  type: 'input' | 'select' | 'date' | 'user' | 'chips';
  value?: any;
  validations?: MeFieldValidator[];
  filterOptions?: MeFieldFilterOptions;
  inputOptions?: MeFieldInputTypeOptions;
  selectOptions?: MeFieldSelectTypeOptions[];
  dateOptions?: MeFieldDateTypeOptions;
  isArray?: boolean;
  alias?: string;
}

export interface MeFieldValidator {
  name: string;
  validator: any;
  message: string;
  injectFormGroup?: boolean;
}

export enum MeFieldRel {
  CONTAINS,
  EQUAL,
  NOT_EQUAL,
  GREATER_THAN,
  LESS_THAN,
  GREATER_EQUAL_THAN,
  LESS_EQUAL_THAN,
  BETWEEN,
  ARRAY_CONTAINS,
}

export interface MeFieldInputTypeOptions {
  inputType?: 'text' | 'number';
}

export interface MeFieldDateTypeOptions {
  minDate: Date;
  maxDate: Date;
  startAt: Date;
}

export interface MeFieldSelectTypeOptions {
  label: string;
  value: string;
}

export interface MeFieldFilterOptions {
  rel: MeFieldRel;
  toLowerCase?: boolean;
  isSameRow?: 'firstElem' | 'secondElem';
  formatter?(label: string, value: any): string;
}

export interface MeUser {
  userName: string;
  name: string;
  photo?: string;
}
