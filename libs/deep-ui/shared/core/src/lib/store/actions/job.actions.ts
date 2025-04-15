import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {DataRetentionObj, EtlJob, PerfectTransformJob} from 'deep-ui/shared/models';

export const jobAPIActions = createActionGroup({
  source: 'Job API',
  events: {
    'patch job from dialog finished': emptyProps(),
    'patch job from dialog': props<{job: Partial<EtlJob>}>(),
    'patch job Failed': emptyProps(),
    'patch job Success': props<{job: Partial<EtlJob>}>(),
    'patch perfect transform job from dialog': props<{job: Partial<PerfectTransformJob>}>(),
    'patch perfect transform job Failed': emptyProps(),
    'patch perfect transform job Success': props<{job: Partial<PerfectTransformJob>}>(),
    'patch jobs Data retention from dialog': props<{
      jobIds: Array<string>;
      dataRetention: DataRetentionObj;
    }>(),
    'patch jobs Data retention Failed': emptyProps(),
    'patch jobs Data retention Success': props<{
      jobs_updated: Array<string>;
      errors?: Array<any>;
    }>(),
    'patch perfect transform jobs Data retention from dialog': props<{
      jobIds: Array<string>;
      dataRetention: DataRetentionObj;
    }>(),
    'patch perfect transform jobs Data retention Failed': emptyProps(),
    'patch perfect transform jobs Data retention Success': props<{
      jobs_updated: Array<string>;
      errors?: Array<any>;
    }>(),
    'patch dataset Data retention': emptyProps(),
    'patch dataset Data retention Failed': emptyProps(),
    'patch dataset Data retention Success': emptyProps(),
  },
});
