import {createAction, props} from '@ngrx/store';

export const deleteMsgSnackbarAction = createAction(
  'Show Delete Entity Msg',
  props<{name: string}>()
);

export const updateMsgSnackbarAction = createAction(
  'Show Update Msg',
  props<{msg: string; override?: boolean}>()
);
