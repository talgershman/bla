import {createAction, createActionGroup, emptyProps, props} from '@ngrx/store';

export const loadTechnologiesAPIActions = createActionGroup({
  source: 'Clip List API',
  events: {
    'Load Technologies Success': props<{technologies: Array<string>}>(),
    'Load Technologies Failed': emptyProps(),
    'Load Technologies From Cache': emptyProps(),
  },
});

export const loadTechnologiesClipListResolver = createAction(
  '[Index Clip List Resolver] Load Technologies'
);
