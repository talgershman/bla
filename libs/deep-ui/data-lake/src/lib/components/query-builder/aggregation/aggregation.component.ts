import {ChangeDetectionStrategy, Component, inject, Input, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {aggregationOperators, QEAggregation} from 'deep-ui/shared/models';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-aggregation',
  templateUrl: './aggregation.component.html',
  styleUrls: ['./aggregation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HintIconComponent, MeSelectComponent, MeInputComponent, ReactiveFormsModule],
})
export class AggregationComponent implements OnInit {
  @Input()
  aggregationForm: FormGroup<any>;

  @Input()
  aggregationConditions: QEAggregation;

  @Input()
  readonly: boolean;

  controlsAggRulesGroup: FormGroup<any>;

  aggregateKeyControl: FormControl<string>;

  operatorControl: FormControl<string>;

  valueControl: FormControl<any>;

  operatorOptions = aggregationOperators;

  aggregateKeyOptions: MeSelectOption[] = [
    {
      id: 'count',
      value: 'Count',
    },
  ];

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this._initForm();
    this._registerEvents();
    this._setDefaults();
    this._loadData();
  }

  private _loadData(): void {
    const data = this.aggregationConditions;
    if (data) {
      if (
        this.aggregateKeyOptions.length &&
        this.aggregateKeyOptions.map((item) => item.id).includes(data.aggregateKey)
      ) {
        this.aggregateKeyControl.setValue(data.aggregateKey);
      }
      if (
        this.operatorOptions.length &&
        this.operatorOptions.map((item) => item.id).includes(data.operator)
      ) {
        this.operatorControl.setValue(data.operator);
      }
      this.valueControl.setValue(data.value);
    }
  }

  private _setDefaults(): void {
    if (this.aggregateKeyOptions.length) {
      this.aggregateKeyControl.setValue(this.aggregateKeyOptions[0].id);
    }
    if (this.operatorOptions.length) {
      this.operatorControl.setValue(this.operatorOptions[0].id);
    }
  }

  private _initForm(): void {
    this._initFormBuilder();
    this._defineControls();
    this._setReadOnlyMode();
  }

  private _setReadOnlyMode(): void {
    if (this.readonly) {
      this.controlsAggRulesGroup.disable();
    }
  }

  private _initFormBuilder(): void {
    this.controlsAggRulesGroup = this.fb.group({
      aggregateKey: new FormControl(null),
      operator: new FormControl(null),
      value: new FormControl(null),
    });
    this.aggregationForm.addControl('aggregateKey', new FormControl(null));
    this.aggregationForm.addControl('operator', new FormControl(null));
    this.aggregationForm.addControl('value', new FormControl(null));
  }

  private _defineControls(): void {
    this.aggregateKeyControl = this.controlsAggRulesGroup.controls.aggregateKey as FormControl;
    this.operatorControl = this.controlsAggRulesGroup.controls.operator as FormControl;
    this.valueControl = this.controlsAggRulesGroup.controls.value as FormControl;
  }

  private _registerEvents(): void {
    this.controlsAggRulesGroup.valueChanges
      .pipe(
        debounceTime(150),
        map((formValue: any) => this._serializeForm(formValue)),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((nextValue: any) => {
        this.aggregationForm.setValue(nextValue);
      });
  }

  private _serializeForm(formValue: any): any {
    if (formValue.value && formValue.operator && formValue.aggregateKey) {
      return {
        aggregateKey: formValue.aggregateKey,
        operator: formValue.operator,
        value: formValue.value,
      };
    }
    return {
      aggregateKey: null,
      operator: null,
      value: null,
    };
  }
}
