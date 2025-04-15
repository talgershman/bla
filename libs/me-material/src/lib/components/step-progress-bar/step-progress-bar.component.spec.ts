import {getElementsBySelector} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeStepDef, MeStepProgressEnum} from './step-progerss-bar-entities';
import {MeStepProgressBarComponent} from './step-progress-bar.component';

const steps: MeStepDef[] = [
  {
    progress: MeStepProgressEnum.DONE,
  },
  {
    progress: MeStepProgressEnum.DONE,
  },
  {
    progress: MeStepProgressEnum.IN_PROGRESS,
  },
  {
    progress: MeStepProgressEnum.FAILED,
  },
  {
    progress: MeStepProgressEnum.NOT_STARTED,
  },
  {
    progress: MeStepProgressEnum.NOT_STARTED,
  },
];

describe('MeStepProgressBarComponent', () => {
  let spectator: Spectator<MeStepProgressBarComponent>;

  const createComponent = createComponentFactory({
    component: MeStepProgressBarComponent,
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('progress item classes', () => {
    spectator.setInput('steps', steps);

    spectator.detectChanges();
    const stepDone = getElementsBySelector(spectator.fixture, '.step-done');
    const stepError = getElementsBySelector(spectator.fixture, '.step-error');
    const stepInProgress = getElementsBySelector(spectator.fixture, '.step-in-progress');

    expect(stepDone.length).toEqual(2);
    expect(stepError.length).toEqual(1);
    expect(stepInProgress.length).toEqual(1);
  });
});
