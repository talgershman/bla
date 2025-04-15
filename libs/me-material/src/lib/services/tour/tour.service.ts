import {ComponentRef, inject, Injectable, ViewContainerRef} from '@angular/core';
import {MeTourConfig, MeTourStatus, MeTourStep} from '@mobileye/material/src/lib/common';
import {MeTourStepComponent} from '@mobileye/material/src/lib/components/tour-step';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {dateDiff, startOfToday} from '@mobileye/material/src/lib/utils';
import {createPopper, OptionsGeneric} from '@popperjs/core';
import {Observable, ReplaySubject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';
import scrollIntoView from 'smooth-scroll-into-view-if-needed';

import {MeTourActionManager} from './tour-action-manager.service';

export interface MeTour extends MeTourConfig {
  viewContainerRef?: ViewContainerRef;
}

interface MeTourState {
  stepComponentInstance?: ComponentRef<MeTourStepComponent>;
  currentStepIndex?: number;
  tourId?: string;
  popperInstance?: any;
  overLayElement?: HTMLElement;
  helperLayerElement?: HTMLElement;
  onTourNextStepEnabledSubject?: ReplaySubject<boolean>;
  onTourCompletedSubject?: ReplaySubject<void>;
  onTourDiscardSubject?: ReplaySubject<void>;
  onTourOpenedSubject?: ReplaySubject<void>;
  onTourClosedSubject?: ReplaySubject<void>;
}

export const ME_TOURS_USER_PREFERENCE_KEY = 'uiTours';
export const ME_TOURS_CONSIDER_AS_NEW_IN_DAYS = 7;

/*
  How does the service works:
  1. It creates a pop dialog using Popper js.
  2. If the target step has not focus element it will display a dialog in the center of the screen
  3. We add the DOM 2 layers that are inserted in save level as the viewContainerRef ( app root) .
     A. The first layer is called: 'overlay-layer' is covers the entire screen and listen for click for closing the dialog.
     B. The second layer on top of the 'overlay-layer' creates a shade effect around the focus element ( cover it and it looks like it is the only element visible)
  4. You can't interact with the focus element only by action, actions can be 'paste'/'type' ...etc using JS Typewriter.
  5. Any window resize will mess up layers calculation, so we just close the tour.
  6. Because we can't interact with the elements we always scroll to focus element position.
 */

@Injectable()
export class MeTourService {
  private tours: Map<string, MeTour> = new Map();
  private state: MeTourState = {};
  private toursSubject: ReplaySubject<MeTour[]> = new ReplaySubject<MeTour[]>(1);

  private tourActionManager = inject(MeTourActionManager);
  private userPreferencesService = inject(MeUserPreferencesService, {optional: true});
  private currentDate = startOfToday();

  createTours(allTours: Array<MeTourConfig>, viewContainerRef: ViewContainerRef): void {
    allTours.forEach((tour) => {
      this._createNewTour(tour, viewContainerRef);
    });
    this._emitTours();
  }

  private _createNewTour(tour: MeTourConfig, viewContainerRef: ViewContainerRef): void {
    let data: MeTour;
    if (this.userPreferencesService) {
      const toursPref = this.userPreferencesService.getUserPreferencesByKey(
        ME_TOURS_USER_PREFERENCE_KEY
      );
      const tourConfig = toursPref?.[tour.id];
      const wasWatched = !!tourConfig?.watched;
      const isNew =
        dateDiff(this.currentDate, tour.creationDate) <= ME_TOURS_CONSIDER_AS_NEW_IN_DAYS;
      data = {
        ...tour,
        viewContainerRef,
        isNew,
        watched: wasWatched,
      };
    } else {
      data = {
        ...tour,
        viewContainerRef,
      };
    }
    if (!tour.status) {
      data.status = 'not_start';
    }
    this.tours.set(tour.id, data);
  }

  getTourById(id: string): MeTour {
    return this.tours.get(id);
  }

  getCurrentTourStep(): MeTourStep {
    const tour = this._getCurrentTour();
    if (tour) {
      return tour.steps[this.state.currentStepIndex];
    }
    return null;
  }

  getOnNextStepClickObs(): Observable<boolean> {
    return this.state.onTourNextStepEnabledSubject?.asObservable();
  }

  getOnTourDiscardSubjectObs(): Observable<void> {
    return this.state.onTourDiscardSubject?.asObservable();
  }

  getOnTourOpenedObs(): Observable<void> {
    return this.state.onTourOpenedSubject?.asObservable();
  }

  getOnTourClosedObj(): Observable<void> {
    return this.state.onTourClosedSubject?.asObservable();
  }

  getOnTourCompletedObj(): Observable<void> {
    return this.state.onTourCompletedSubject?.asObservable();
  }

  async startTour(tourId: string, overrideOptions?: Partial<MeTourConfig>): Promise<void> {
    this._resetAll();
    this._initCurrentTour(tourId, overrideOptions);
    await this._awaitWrapper(this._startCurrentStep.bind(this));
  }

  async discardActiveTour(): Promise<void> {
    const tour = this._getCurrentTour();
    if (!this.state || !tour) {
      return Promise.resolve();
    }
    this.state.onTourClosedSubject.next();
    // if not the last step consider as discarded
    if (!this._noMoreSteps(tour)) {
      this._setTourStatus('discarded');
      this.state.onTourDiscardSubject.next();
    } else {
      await this._awaitWrapper(this._handleTourComplete.bind(this));
    }
    this._resetAll();
    return Promise.resolve();
  }

  async onNextStepClick(): Promise<void> {
    const currentTour = this._getCurrentTour();
    this.state.currentStepIndex++;
    await this._awaitWrapper(this._runNextStep.bind(this, currentTour));
  }

  getToursObservable(): Observable<MeTour[]> {
    return this.toursSubject.asObservable();
  }

  //todo: will need to the future
  // waitForElement(selector:string, timeout: number): Promise<any> {
  //   const isLoadedPromise = this._isElementLoaded(selector);
  //   const timeoutPromise = new Promise((_, reject) => {
  //     return setTimeout(() => reject(new Error(`the timeout for selector : '${selector}' has been reached: ${timeout}ms`)), timeout)
  //   });
  //   return Promise.race([isLoadedPromise, timeoutPromise])
  // }

  //todo: will need to the future
  // private async _isElementLoaded(selector:string): Promise<any> {
  //   while ( document.querySelector(selector) === null) {
  //     await new Promise( resolve =>  requestAnimationFrame(resolve) );
  //   }
  //   return document.querySelector(selector);
  // };

  private _emitTours(): void {
    const toursArray: MeTour[] = Array.from(this.tours.values());
    if (this.userPreferencesService) {
      const toursObj = this._serializeTourObject();
      this.userPreferencesService.addUserPreferences(ME_TOURS_USER_PREFERENCE_KEY, toursObj);
    }
    this.toursSubject.next(toursArray);
  }

  private _serializeTourObject(): any {
    const result = {};
    for (const [id, value] of this.tours) {
      result[id] = {
        watched: !!value.watched,
        id: value.id,
      };
    }
    return result;
  }

  private _getCurrentTour(): MeTour {
    return this.tours.get(this.state.tourId);
  }

  private _initCurrentTour(tourId: string, overrideOptions: Partial<MeTourConfig>): void {
    this.state.tourId = tourId;
    this._initTourSubjects();
    this._registerToGlobalEvents(false);
    this._overrideTourConfig(tourId, {
      ...(overrideOptions || {}),
      watched: true,
    });
    this.state.onTourOpenedSubject.next();
    this.state.currentStepIndex = 0;
    this._setTourStatus('in_progress');
    this._createOverlayElements();
  }

  private _initTourSubjects(): void {
    this.state.onTourNextStepEnabledSubject = new ReplaySubject<boolean>();
    this.state.onTourOpenedSubject = new ReplaySubject<void>();
    this.state.onTourDiscardSubject = new ReplaySubject<void>();
    this.state.onTourCompletedSubject = new ReplaySubject<void>();
    this.state.onTourClosedSubject = new ReplaySubject<void>();
  }

  private _completeTourSubjects(): void {
    this.state.onTourNextStepEnabledSubject?.complete();
    this.state.onTourOpenedSubject?.complete();
    this.state.onTourDiscardSubject?.complete();
    this.state.onTourCompletedSubject?.complete();
    this.state.onTourClosedSubject?.complete();
  }

  private async _runNextStep(tour: MeTour): Promise<void> {
    if (this._noMoreSteps(tour)) {
      await this._awaitWrapper(this._handleTourComplete.bind(this));
    } else {
      await this._awaitWrapper(this._startCurrentStep.bind(this));
    }
  }

  private async _handleTourComplete(): Promise<void> {
    this._setTourStatus('completed');
    this.state.onTourClosedSubject.next();
    this.state.onTourCompletedSubject.next();
    this._resetAll();
  }

  private async _startCurrentStep(): Promise<void> {
    let currentTour = this._getCurrentTour();
    if (!currentTour) {
      return;
    }
    this._resetCurrentStep();
    currentTour = this._getCurrentTour();
    if (this._noMoreSteps(currentTour)) {
      return;
    }
    const stepIndex = this.state.currentStepIndex;
    const step = currentTour.steps[stepIndex];
    if (step.targetSelector) {
      await this._awaitWrapper(this._createPopperElement.bind(this, step, stepIndex));
    } else {
      this._createFixedElement(step, stepIndex);
    }
    await this._handleStepActions(step);
  }

  private async _createPopperElement(step: MeTourStep, stepIndex: number): Promise<void> {
    const currentTour = this._getCurrentTour();
    this.state.stepComponentInstance = this._createStepComponent(currentTour, step, stepIndex);
    if (!this.state.stepComponentInstance) {
      return Promise.resolve();
    }
    const reference = document.querySelector(step.targetSelector);
    this.state.stepComponentInstance.instance.maxWidth = `${
      window.innerWidth - reference.getBoundingClientRect().width - 150
    }px`;
    const defaultOptions: Partial<OptionsGeneric<any>> = {
      placement: 'bottom',
      modifiers: [
        {
          name: 'arrow',
          options: {
            padding: 32,
          },
        },
        {
          name: 'offset',
          options: {
            offset: [0, 16],
          },
        },
      ],
    };
    // popper doesn't work with main angular component, so pass the first container inside for it.
    const stepComponent = this.state.stepComponentInstance.location.nativeElement.children[0];

    try {
      this.state.popperInstance = createPopper(reference, stepComponent, {
        ...defaultOptions,
        ...step.tooltipOptions,
      });
    } catch {}

    await this._awaitWrapper(this._scrollToBottom.bind(this, reference));
    this._updateOverlayStyle(step);
  }

  private async _onPrevStepClick(): Promise<void> {
    const currentTour = this._getCurrentTour();
    this.state.currentStepIndex--;
    await this._awaitWrapper(this._runNextStep.bind(this, currentTour));
  }

  private async _scrollToBottom(element: Element): Promise<void> {
    await this._awaitWrapper(
      scrollIntoView.bind(this, element, {
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    );
  }

  private async _handleStepActions(step: MeTourStep): Promise<void> {
    const tour = this._getCurrentTour();
    if (!tour) {
      return Promise.resolve();
    }
    if (!step.actions?.length) {
      this.state.onTourNextStepEnabledSubject.next(true);
    } else {
      this.state.onTourNextStepEnabledSubject.next(false);
      await this._handleNextAction(step, 0);
    }
  }

  private async _handleNextAction(step: MeTourStep, actionIndex: number): Promise<void> {
    const currentTour = this._getCurrentTour();
    if (
      !currentTour ||
      currentTour.status !== 'in_progress' ||
      step.actions.length < actionIndex + 1
    ) {
      this.state.onTourNextStepEnabledSubject?.next(true);
      return;
    }
    const action = step.actions[actionIndex];
    if (action.waitFor) {
      await this.tourActionManager.waitForPromise(action.waitFor);
    }

    switch (action.type) {
      case 'type': {
        const inputElement = this.tourActionManager.getInputElement(action.inputSelector);
        await this.tourActionManager.handleTypeAction(
          action,
          currentTour,
          this._afterActionDone.bind(this, step, actionIndex, inputElement)
        );
        break;
      }
      case 'click-element': {
        await this.tourActionManager.handleClickElementAction(
          action,
          this._afterActionDone.bind(this, step, actionIndex)
        );
        break;
      }
      case 'paste': {
        const inputElement = this.tourActionManager.getInputElement(action.inputSelector);
        await this.tourActionManager.handleCopyAction(
          action,
          currentTour,
          this._afterActionDone.bind(this, step, actionIndex, inputElement)
        );
        break;
      }
    }
  }

  private async _afterActionDone(
    step: MeTourStep,
    actionIndex: number,
    input?: HTMLInputElement
  ): Promise<void> {
    if (input) {
      input.blur();
    }
    const tour = this._getCurrentTour();
    if (!tour) {
      return;
    }
    //wait for blur effect to update the target element sizes
    setTimeout(() => {
      this._updateHelperLayerSizes(step);
    }, 250);
    await this._handleNextAction(step, actionIndex + 1);
  }

  private async _awaitWrapper(func: Function): Promise<void> {
    if (func) {
      try {
        await func(this);
      } catch (error) {
        console.error(error);
      }
    }
  }

  private _overrideTourConfig(tourId: string, overrideOptions: Partial<MeTourConfig>): void {
    const savedTour = this.tours.get(tourId) as MeTour;
    const wasWatched = savedTour.watched;
    const tourConfig: MeTour = {
      ...savedTour,
      ...overrideOptions,
    };
    this.tours.set(tourId, tourConfig);
    if (!wasWatched && overrideOptions.watched) {
      this._emitTours();
    }
  }

  private _createFixedElement(step: MeTourStep, stepIndex: number): void {
    const currentTour = this._getCurrentTour();
    this.state.stepComponentInstance = this._createStepComponent(
      currentTour,
      step,
      stepIndex,
      true
    );
    this._updateOverlayStyle(null);
  }

  private _resetAll(): void {
    this._registerToGlobalEvents(true);
    this._resetState();
  }

  private _resetState(): void {
    this._resetCurrentStep();
    this._clearOverlayElements();
    this.tourActionManager.clearTypeWriter();
    this._completeTourSubjects();
    this.state = {};
  }

  private _resetCurrentStep(): void {
    if (this.state.stepComponentInstance) {
      this.state.stepComponentInstance?.destroy();
    }
    if (this.state.popperInstance) {
      this.state.popperInstance.destroy();
    }
    this.tourActionManager.stopTypeWriter();
  }

  private _createStepComponent(
    tour: MeTour,
    step: MeTourStep,
    stepIndex,
    isFixedPosition = false
  ): ComponentRef<MeTourStepComponent> {
    const comp = tour.viewContainerRef.createComponent<MeTourStepComponent>(MeTourStepComponent);
    comp.instance.step = step;
    comp.instance.currentStepIndex = stepIndex;
    comp.instance.totalSteps = tour.steps.length;
    comp.instance.headlineTitle = step.headlineTitle;
    comp.instance.isStartStep = step.isStartStep;
    comp.instance.showPrevButton = step.showPrevButton;
    comp.instance.prevClicked.subscribe(async () => {
      await this._onPrevStepClick();
    });
    comp.instance.isButtonsEnabled$ = this.state.onTourNextStepEnabledSubject
      .asObservable()
      .pipe(distinctUntilChanged());
    comp.instance.closeClicked.subscribe(async () => {
      await this._awaitWrapper(this.discardActiveTour.bind(this));
    });
    comp.instance.nextClicked.subscribe(async () => {
      await this._awaitWrapper(this.onNextStepClick.bind(this));
    });
    comp.instance.shouldRender = true;
    comp.instance.isFixedPosition = isFixedPosition;
    comp.changeDetectorRef.detectChanges();
    this.state.onTourNextStepEnabledSubject.next(false);
    return comp;
  }

  private _setTourStatus(status: MeTourStatus): void {
    const tour = this._getCurrentTour();
    if (!tour) {
      return;
    }
    tour.status = status;
    this.tours.set(tour.id, tour);
  }

  private _noMoreSteps(tour: MeTour): boolean {
    return tour.steps.length <= this.state.currentStepIndex;
  }

  private _registerToGlobalEvents(removeListen: boolean): void {
    const handler = async (event: KeyboardEvent): Promise<void> => {
      if (event.key === 'Escape') {
        await this._awaitWrapper(this.discardActiveTour.bind(this));
      }
    };
    if (removeListen) {
      document.removeEventListener('keydown', handler, false);
      window.removeEventListener('resize', this.discardActiveTour.bind(this), true);
    } else {
      document.addEventListener('keydown', handler, false);
      window.addEventListener('resize', this.discardActiveTour.bind(this), true);
    }
  }

  private _createOverlayElements(): void {
    const tour = this._getCurrentTour();
    if (!tour) {
      return;
    }
    const doc = tour.viewContainerRef.element.nativeElement;
    this.state.overLayElement = document.createElement('div');
    this.state.overLayElement.classList.add('me-tour-overlay');
    this.state.overLayElement.addEventListener('click', this.discardActiveTour.bind(this));
    this.state.helperLayerElement = document.createElement('div');
    this.state.helperLayerElement.classList.add('me-tour-helper-layer');
    doc.parentElement.appendChild(this.state.overLayElement);
    doc.parentElement.appendChild(this.state.helperLayerElement);
  }

  private _updateHelperLayerSizes(step: MeTourStep): void {
    if (!step.targetSelector || !this.state.helperLayerElement) {
      return;
    }
    const elem = document.querySelector(step.targetSelector);
    const elemSizes = elem.getBoundingClientRect();
    const padding = 16;
    this.state.helperLayerElement.style.width = `${elemSizes.width + padding}px`;
    this.state.helperLayerElement.style.height = `${elemSizes.height + padding}px`;
    this.state.helperLayerElement.style.top = `${elemSizes.top + window.scrollY - padding / 2}px`;
    this.state.helperLayerElement.style.left = `${elemSizes.left + window.scrollX - padding / 2}px`;
  }

  private _clearOverlayElements(): void {
    if (this.state.helperLayerElement) {
      document.body.removeChild(this.state.helperLayerElement);
    }
    if (this.state.overLayElement) {
      this.state.overLayElement.removeEventListener('click', this.discardActiveTour.bind(this));
      document.body.removeChild(this.state.overLayElement);
    }
  }

  private _updateOverlayStyle(step: MeTourStep): void {
    if (this.state.overLayElement) {
      this.state.overLayElement.style.inset = '0';
      this.state.overLayElement.style.position = 'fixed';
    }
    if (this.state.helperLayerElement) {
      this.state.helperLayerElement.style.boxShadow =
        'rgba(30, 46, 184, 1) 0px 0px 1px 2px, rgba(33, 33, 33, 0.5) 0px 0px 0px 5000px';
      this.state.helperLayerElement.style.opacity = '1';

      if (!step?.targetSelector) {
        this.state.helperLayerElement.style.opacity = '1';
        this.state.helperLayerElement.style.inset = '0';
        this.state.helperLayerElement.style.width = '0';
        this.state.helperLayerElement.style.height = '0';
        this.state.helperLayerElement.style.transition = 'none';
      } else {
        this.state.helperLayerElement.style.transition = 'all .3s ease-out';
        this._updateHelperLayerSizes(step);
      }
    }
  }
}
