import {MeErrorObject} from '@mobileye/material/src/lib/services/error-handler';
import {createAction, props} from '@ngrx/store';

export const queryFilePathErrorAction = createAction(
  '[On Prem Service] Query File Path Error',
  props<Partial<MeErrorObject>>()
);

export const queryRunDatasetQueryErrorAction = createAction(
  '[Dataset Form Component] Execute Dataset Query Error',
  props<Partial<MeErrorObject>>()
);

export const queryClipsSampleErrorAction = createAction(
  '[Query Sample Dialog Component] Clips Sample Query Error',
  props<Partial<MeErrorObject>>()
);

export const deletePerfectListErrorAction = createAction(
  '[Index Perfect List Component] Delete Perfect List Error',
  props<Partial<MeErrorObject>>()
);
