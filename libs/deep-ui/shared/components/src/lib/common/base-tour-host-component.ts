import {
  AfterViewInit,
  Directive,
  inject,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {MeTourConfig, MeTourStep} from '@mobileye/material/src/lib/common';
import {CustomTourStepDirective} from '@mobileye/material/src/lib/components/tour-step';
import {MeTourService} from '@mobileye/material/src/lib/services/tour';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {allTours} from 'deep-ui/shared/configs';
import _find from 'lodash-es/find';
import {Observable} from 'rxjs';

@UntilDestroy()
@Directive()
export abstract class BaseTourHostComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(CustomTourStepDirective) customTourSteps: QueryList<CustomTourStepDirective>;

  @Input()
  showTour: Observable<void>;

  public tourService = inject(MeTourService);

  ngOnInit(): void {
    this.showTour?.pipe(untilDestroyed(this)).subscribe(async () => this.startTour());
  }

  ngAfterViewInit(): void {
    this._appendCustomTemplatesToTour();
  }

  async ngOnDestroy(): Promise<void> {
    await this.tourService.discardActiveTour();
  }

  abstract startTour(): Promise<void>;

  private _appendCustomTemplatesToTour(): void {
    for (const customStep of this.customTourSteps) {
      const foundTour: MeTourConfig = _find(
        allTours,
        (tour: MeTourConfig) => tour.id === customStep.tourId,
      );
      const foundStep: MeTourStep = _find(
        foundTour.steps,
        (step: MeTourStep) => step.id === customStep.stepId,
      );
      foundStep.template = customStep.templateRef;
    }
  }
}
