import {createActionGroup, emptyProps} from '@ngrx/store';

export const checkForUpdateActions = createActionGroup({
  source: 'Check For Update',
  events: {
    'new UI Version Became Available': emptyProps(),
    'no New UI Version': emptyProps(),
  },
});

export const broadcastEffectsActions = createActionGroup({
  source: 'Broadcast Effects',
  events: {
    'update Other Tabs': emptyProps(),
  },
});
