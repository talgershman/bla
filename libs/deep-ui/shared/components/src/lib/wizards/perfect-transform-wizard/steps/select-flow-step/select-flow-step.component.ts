import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {MatRadioChange, MatRadioModule} from '@angular/material/radio';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {AgDataSourceTablePerfectsStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-perfects-standalone';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {Datasource, DataSourceSelection, PerfectTransformRunType} from 'deep-ui/shared/models';
import {distinctUntilChanged} from 'rxjs/operators';

import {flowButtons} from './select-flow-step-entities';

@UntilDestroy()
@Component({
  selector: 'de-select-flow-step',
  templateUrl: './select-flow-step.component.html',
  styleUrls: ['./select-flow-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatRadioModule, AgDataSourceTablePerfectsStandaloneComponent, ReactiveFormsModule],
})
export class SelectFlowStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  disableRefreshInterval: boolean;

  @Output()
  dataSourceSelectChanged = new EventEmitter<Datasource>();

  private fb = inject(FormBuilder);

  buttons = flowButtons;

  selectedId: PerfectTransformRunType;

  form = this.fb.group(
    {
      flowType: new FormControl<PerfectTransformRunType>(
        this.buttons[0].id as PerfectTransformRunType,
        Validators.required,
      ),
      dataSource: new FormControl<Datasource>(null),
    },
    {
      validators: (): ValidationErrors => {
        if (!this.form) {
          return null;
        }
        if (
          this.form.controls.flowType?.value === 'UPDATE' &&
          !this.form.controls.dataSource?.value
        ) {
          return {invalid: true};
        }
        return null;
      },
    },
  );

  ngOnInit(): void {
    this._registerEvents();
    this.formState.emit(this.form.status);
  }

  onSelectChanged(selection: MatRadioChange): void {
    this.selectedId = selection.value.id;
    if (this.selectedId === 'CREATE') {
      this.onPerfectDataSourceSelectionChange({dataSource: null});
    }
    this.form.controls.flowType.setValue(this.selectedId);
  }

  onPerfectDataSourceSelectionChange(selection: DataSourceSelection): void {
    this.form.controls.dataSource.setValue(selection?.dataSource);
    this.dataSourceSelectChanged.emit(selection?.dataSource);
  }

  private _registerEvents(): void {
    this.form.statusChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((value: FormControlStatus) => {
        this.formState.emit(value);
      });
  }
}
