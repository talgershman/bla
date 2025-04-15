export type Subset<K> = {
  [attr in keyof K]?: K[attr] extends object ? Subset<K[attr]> : K[attr];
};

export const StatusTypes: Array<string> = [
  'active',
  'inactive',
  'failed',
  'updating',
  'needs_sync',
];

export const DISABLED_FLOWS_WITH_MEST_STEPS = ['CLIP2LOG', 'METRO'];

export enum JobsDynamicViewEnum {
  PERFECT_TRANSFORM = 'PERFECT_TRANSFORM',
  ETL = 'ETL',
}

export const DUPLICATE_ID_FIXED_APPEND = 100000;

export const PerfectListStatusTypes: Array<string> = [
  'in_progress',
  'syncing',
  'updating',
  'active',
  'failed',
];

export const USER_PREF_RE_TRIGGER_PREFIX = 'RETRIGGER_';

export const TAB_VIEW_PARAM = 'tabView';

interface ApiCallLoading<TResult> {
  status: 'loading';
  result: TResult;
}
interface ApiCallLoaded<TResult> {
  status: 'loaded';
  result: TResult;
}
interface ApiCallError<TError> {
  status: 'error';
  error: TError;
}

export type ApiCallState<TResult, TError = string> =
  | ApiCallLoading<TResult>
  | ApiCallLoaded<TResult>
  | ApiCallError<TError>;

export type GOLDEN_LABELS_WIZARD_TYPE = 'created' | 'updateSchema';
