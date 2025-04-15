import {Component, inject, ViewContainerRef} from '@angular/core';
import {MeTourConfig} from '@mobileye/material/src/lib/common';
import {MeTourStepComponent} from '@mobileye/material/src/lib/components/tour-step';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeTour, MeTourService} from './tour.service';
import {MeTourActionManager} from './tour-action-manager.service';
import {MeTourActionManagerMock} from './tour-action-manager-mock.service';

@Component({
  template: `
    <main>
      <div class="step-1">Step1: <input class="step-1-input" /></div>
      <div class="step-2">Step2:</div>
      <div class="step-3">Step3: <input class="step-3-input" /></div>
    </main>
  `,
})
class TestComponent {
  tourService = inject(MeTourService);
  viewContainerRef = inject(ViewContainerRef);

  tourOpenedCalled: boolean;
  tourClosedCalled: boolean;
  discardTourCalled: boolean;
  completeTourCalled: boolean;
  currentTour: MeTour;

  handleTourOpened(): void {
    this.tourOpenedCalled = true;
  }
  handleTourClosed(): void {
    this.tourClosedCalled = true;
  }
  handleDiscard(): void {
    this.discardTourCalled = true;
  }
  handleCompleteTour(): void {
    this.completeTourCalled = true;
  }
}

describe('MeTourService', () => {
  let spectator: Spectator<TestComponent>;

  const createComponent = createComponentFactory({
    component: TestComponent,
    imports: [MeTourStepComponent, TestComponent],
    providers: [
      MeTourService,
      {
        provide: MeTourActionManager,
        useClass: MeTourActionManagerMock,
      },
    ],
    mocks: [MeUserPreferencesService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.tourOpenedCalled = false;
    spectator.component.tourClosedCalled = false;
    spectator.component.discardTourCalled = false;
    spectator.component.completeTourCalled = false;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should finish tour with all steps', (done) => {
    (async function () {
      const tourId = 'test-1';
      const tour: MeTourConfig = {
        id: tourId,
        creationDate: '2022-12-29',
        watched: false,
        route: ['bla'],
        menuTitle: 'bla tour',
        steps: [
          {
            title: 'Step 1 - Title',
          },
          {
            title: 'Step 2 - Title',
            targetSelector: '.step-2',
          },
          {
            title: 'Step 3 - Title',
            targetSelector: '.step-3',
          },
        ],
      };
      spectator.detectChanges();

      spectator.component.tourService.createTours([tour], spectator.component.viewContainerRef);

      spectator.component.tourService.getToursObservable().subscribe((tours: Array<MeTour>) => {
        spectator.component.currentTour = tours[0];
      });

      await spectator.component.tourService.startTour(tourId);

      spectator.component.tourService.getToursObservable().subscribe(() => {
        spectator.component.handleTourClosed();
      });

      spectator.component.tourService.getOnTourOpenedObs().subscribe(() => {
        spectator.component.handleTourOpened();
      });

      spectator.component.tourService.getOnTourClosedObj().subscribe(() => {
        spectator.component.handleTourClosed();
      });

      spectator.component.tourService.getOnTourCompletedObj().subscribe(() => {
        spectator.component.handleCompleteTour();

        expect(spectator.component.tourOpenedCalled).toBeTruthy();
        expect(spectator.component.tourClosedCalled).toBeTruthy();
        expect(spectator.component.completeTourCalled).toBeTruthy();
        expect(spectator.component.currentTour).toBeDefined();
        expect(spectator.component.currentTour.watched).toBeTruthy();
        done();
      });

      spectator.component.tourService.getOnNextStepClickObs().subscribe(async () => {
        await spectator.component.tourService.onNextStepClick();
      });
    })();
  });

  it('should fire discard event', (done) => {
    (async function () {
      const tourId = 'test-2';
      const tour: MeTourConfig = {
        id: tourId,
        creationDate: '2022-12-29',
        watched: false,
        route: ['bla'],
        menuTitle: 'bla tour',
        steps: [
          {
            title: 'Step 1 - Title',
          },
          {
            title: 'Step 2 - Title',
            targetSelector: '.step-2',
          },
          {
            title: 'Step 3 - Title',
            targetSelector: '.step-3',
          },
        ],
      };
      spectator.detectChanges();

      spectator.component.tourService.createTours([tour], spectator.component.viewContainerRef);

      await spectator.component.tourService.startTour(tourId);

      spectator.component.tourService.getOnTourOpenedObs().subscribe(() => {
        spectator.component.handleTourOpened();
      });

      spectator.component.tourService.getOnTourClosedObj().subscribe(() => {
        spectator.component.handleTourClosed();
      });

      spectator.component.tourService.getOnTourDiscardSubjectObs().subscribe(() => {
        spectator.component.handleDiscard();

        expect(spectator.component.tourOpenedCalled).toBeTruthy();
        expect(spectator.component.tourClosedCalled).toBeTruthy();
        expect(spectator.component.discardTourCalled).toBeTruthy();
        expect(spectator.component.completeTourCalled).toBeFalsy();
        done();
      });

      spectator.component.tourService.getOnNextStepClickObs().subscribe(async () => {
        const step = spectator.component.tourService.getCurrentTourStep();
        if (step.title === 'Step 2 - Title') {
          await spectator.component.tourService.discardActiveTour();
        } else {
          await spectator.component.tourService.onNextStepClick();
        }
      });
    })();
  });
});
