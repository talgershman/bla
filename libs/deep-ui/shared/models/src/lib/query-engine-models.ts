import _uniq from 'lodash-es/uniq';

import {Datasource} from './datasource';
import {VersionDataSource} from './version-datasource';

export interface QueryObject {
  queries: SubQuery[];
}

export interface SubQuery {
  dataSourceId: string;
  query: SubQueryObject;
  dataSourceVersionId?: number;
  userFacingVersion?: string;
}

export interface SubQueryObject {
  columns: Array<string>;
  conditions: QEQueryConditions;
  materialized: boolean;
  aggregation?: QEAggregation;
}

export interface QEQueryConditions {
  condition: 'AND' | 'OR';
  rules: Array<QERule>;
}

export interface QEAggregation {
  aggregateKey: string;
  operator: string;
  value: string;
}

export interface QERule {
  key: string;
  operator: string;
  value: Array<string> | string | null;
  type: QERuleTypes;
}

export type QEAttributeTypes =
  | 'string'
  | 'integer'
  | 'double'
  | 'boolean'
  | 'array<string>'
  | 'array<double>'
  | 'array<integer>'
  | 'unknown';
export type QERuleTypes = Exclude<QEAttributeTypes, 'unknown'>;

export const ALLOW_QUERY_COLUMN_TYPE_ATTRIBUTES: Set<QEAttributeTypes> = new Set([
  'string',
  'integer',
  'double',
  'boolean',
  'array<string>',
]);

export interface QEAttribute {
  columnName: string;
  columnType: QEAttributeTypes;
  values?: Array<string>;
}

export const nullOperators = [
  {
    id: 'is_null',
    value: 'Is NULL',
  },
  {
    id: 'is_not_null',
    value: 'Is not NULL',
  },
];

export const commonOperators = [
  {
    id: 'equal',
    value: 'Equal',
  },
  {
    id: 'not_equal',
    value: 'Not equal',
  },
];

export const booleanOperators = [
  {
    id: 'equal',
    value: 'Equal',
  },
  {
    id: 'not_equal',
    value: 'Not equal',
  },
  ...nullOperators,
];

export const booleanOptions = [
  {
    id: 'true',
    value: 'True',
  },
  {
    id: 'false',
    value: 'False',
  },
];

export const numberOperators = [
  ...commonOperators,
  {
    id: 'less',
    value: 'Less',
  },
  {
    id: 'less_or_equal',
    value: 'Less or equal',
  },
  {
    id: 'greater',
    value: 'Greater',
  },
  {
    id: 'greater_or_equal',
    value: 'Greater or equal',
  },
  ...nullOperators,
];

export const aggregationOperators = [
  {
    id: 'greater',
    value: 'Greater',
  },
  {
    id: 'less',
    value: 'Less',
  },
  {
    id: 'equal',
    value: 'Equal',
  },
];

export const arrayOperators = [
  {
    id: 'in',
    value: 'In',
  },
  {
    id: 'not_in',
    value: 'Not In',
  },
  ...nullOperators,
];

export const stringArrayOperators = [
  {
    id: 'contains',
    value: 'Contains',
  },
  {
    id: 'not_contains',
    value: 'Not Contains',
  },
  ...nullOperators,
];

export const closeListOperators = [...commonOperators, ...arrayOperators];

export const stringOperators = [
  ...commonOperators,
  {
    id: 'like',
    value: 'Like',
  },
  {
    id: 'not_like',
    value: 'Not Like',
  },
  ...arrayOperators,
];

export const allOperators = _uniq([
  ...commonOperators,
  ...arrayOperators,
  ...stringOperators,
  ...numberOperators,
  ...nullOperators,
]);

export interface SelectedSubQuery extends SubQuery {
  version: VersionDataSource;
  dataSource: Datasource;
  errorMsg?: string;
}
