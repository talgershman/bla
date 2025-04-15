import {CdkStepperModule} from '@angular/cdk/stepper';
import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {Dataset, Datasource, SelectedSubQuery} from 'deep-ui/shared/models';
import {ReplaySubject} from 'rxjs';

import {DatasetFormComponent} from '../../forms/dataset-form/dataset-form.component';
import {QueryStepperComponent} from '../query-stepper/query-stepper.component';
import {StepperContainerComponent} from '../stepper-container/stepper-container.component';

@Component({
  selector: 'de-dataset-stepper',
  templateUrl: './dataset-stepper.component.html',
  styleUrls: ['./dataset-stepper.component.scss'],
  imports: [
    StepperContainerComponent,
    CdkStepperModule,
    DatasetFormComponent,
    QueryStepperComponent,
  ],
})
export class DatasetStepperComponent {
  @ViewChild(StepperContainerComponent) stepper: MatStepper;

  @Input()
  dataset: Dataset;

  @Input()
  selectedDataSources: Array<Datasource>;

  @Input()
  subQueries: Array<SelectedSubQuery>;

  @Input()
  mode: 'edit' | 'create' = 'create';

  @Output()
  fromValueChanged = new EventEmitter<Partial<Dataset>>();

  triggerEditSubQuery = new ReplaySubject<SelectedSubQuery>(1);

  triggerEditSubQuery$ = this.triggerEditSubQuery.asObservable();

  triggerFirstStep = new ReplaySubject<void>(1);

  triggerFirstStep$ = this.triggerFirstStep.asObservable();

  handleEditSubQueryClicked(subQuery: SelectedSubQuery): void {
    this.stepper.next();
    this.triggerEditSubQuery.next(subQuery);
  }

  handleMoveBackedFromStepper(): void {
    this._clearTriggers();
    this.stepper.previous();
  }

  handleAddSubQueryClicked(): void {
    this.stepper.next();
    this.triggerFirstStep.next();
  }

  private _clearTriggers(): void {
    this.triggerFirstStep.complete();
    this.triggerFirstStep = new ReplaySubject<void>();
    this.triggerFirstStep$ = this.triggerFirstStep.asObservable();

    this.triggerEditSubQuery.complete();
    this.triggerEditSubQuery = new ReplaySubject<SelectedSubQuery>();
    this.triggerEditSubQuery$ = this.triggerEditSubQuery.asObservable();
  }
}
