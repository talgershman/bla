import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BUDGET_GROUP_TOOLTIP_MSG} from 'deep-ui/shared/common';
import {BudgetGroupControl} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {DataRetentionControlComponent} from 'deep-ui/shared/components/src/lib/controls/data-retention-control';
import {OverrideEtlParamsControlComponent} from 'deep-ui/shared/components/src/lib/controls/override-etl-params-control';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {DataRetentionService, DatasourceService, DeepUtilService} from 'deep-ui/shared/core';
import {
  DataRetentionConfig,
  DataRetentionObj,
  Datasource,
  ETL,
  PerfectTransformRunType,
  RawDataOwnerType,
  RawDataOwnerTypes,
} from 'deep-ui/shared/models';
import {DataSourceFormValidations} from 'deep-ui/shared/validators';
import {OnChange} from 'property-watch-decorator';
import {Observable, of, Subject} from 'rxjs';
import {distinctUntilChanged, filter, first, startWith, switchMap} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-datasource-details-step',
  templateUrl: './datasource-details-step.component.html',
  styleUrls: ['./datasource-details-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeInputComponent,
    MeSelectComponent,
    MeFormControlChipsFieldComponent,
    DataRetentionControlComponent,
    ReactiveFormsModule,
    MeTextareaComponent,
    OverrideEtlParamsControlComponent,
    BudgetGroupControl,
  ],
})
export class DatasourceDetailsStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  triggerValidation: Observable<void>;

  @Input()
  duplicateDatasource: Datasource;

  @OnChange<void>('_onSelectedDatasourceChanged')
  @Input()
  selectedDatasource: Datasource;

  @OnChange<void>('_onRunTypeChanged')
  @Input()
  runType: PerfectTransformRunType;

  @Input()
  dataRetentionInfoObj: DataRetentionConfig;

  @Input()
  etl: ETL;

  private datasourceService = inject(DatasourceService);
  private deepUtilService = inject(DeepUtilService);
  private dataRetentionService = inject(DataRetentionService);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);

  dataRetentionObj: DataRetentionObj;

  dataSourceDetailsForm = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
    }),
    rawDataOwner: new FormControl<RawDataOwnerType>(null),
    team: new FormControl<string>('', {
      nonNullable: true,
    }),
    budgetGroup: new FormControl<string>(null),
    tags: new FormControl<Array<string>>([]),
    description: new FormControl<string>(''),
    dataRetention: new FormControl<any>(null),
    overrideParams: new FormControl<any>(null),
  });

  deepTeamOptions: string[] = [];

  rawDataOwnerOptions = RawDataOwnerTypes;

  readonly BUDGET_GROUP_TOOLTIP_MSG = BUDGET_GROUP_TOOLTIP_MSG;

  // eslint-disable-next-line
  private isFormValid = new Subject<void>();

  ngOnInit(): void {
    this._registerEvents();
    this._setDeepTeamOptions();
    this._initForm();
    this.dataSourceDetailsForm.patchValue({
      ...(this.duplicateDatasource as any),
    });
    this._setDataRetentionObj();
  }

  onNextClicked(): void {
    this.dataSourceDetailsForm.controls.name.updateValueAndValidity();
    this.isFormValid.next();
  }

  private _registerEvents(): void {
    this.dataSourceDetailsForm.statusChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((value: FormControlStatus) => this.formState.emit(value));

    this.triggerValidation?.pipe(untilDestroyed(this)).subscribe(() => this.onNextClicked());
  }

  private _setFormValidation(): void {
    const isUpdateFlow = this._isUpdateFlow();
    this.dataSourceDetailsForm.controls.name.setValidators(
      !isUpdateFlow ? Validators.required : null,
    );
    this.dataSourceDetailsForm.controls.name.setAsyncValidators(
      !isUpdateFlow
        ? DataSourceFormValidations.checkDatasourceName(this.datasourceService, this.cd)
        : null,
    );
    this.dataSourceDetailsForm.controls.name.updateValueAndValidity();

    this.dataSourceDetailsForm.controls.rawDataOwner.setValidators(
      !isUpdateFlow ? Validators.required : null,
    );
    this.dataSourceDetailsForm.controls.rawDataOwner.updateValueAndValidity();

    this.dataSourceDetailsForm.controls.team.setValidators(
      !isUpdateFlow ? Validators.required : null,
    );
    this.dataSourceDetailsForm.controls.team.updateValueAndValidity();
  }

  private _isUpdateFlow(): boolean {
    return this.runType === 'UPDATE';
  }

  private _setDeepTeamOptions(): void {
    const teams = this.deepUtilService.getCurrentUserTeams();
    this.deepTeamOptions = teams;
  }

  private _initForm(): void {
    const defaultTeam = this._getDefaultTeam();
    this.dataSourceDetailsForm.controls.team.setValue(defaultTeam);
  }

  private _getDefaultTeam(): string {
    if (this.deepTeamOptions?.length === 1) {
      return this.deepTeamOptions[0];
    }
    return '';
  }

  // eslint-disable-next-line
  private isFormValidObj = this.isFormValid
    .asObservable()
    .pipe(switchMap(this._isFormValid.bind(this)), untilDestroyed(this));

  // eslint-disable-next-line
  private isFormValid$ = this.isFormValidObj.subscribe((status: string) => {
    if (status === 'VALID') {
      this.moveToNextStep.emit();
    }
    this.cd.detectChanges();
  });

  private _isFormValid(): Observable<any> {
    if (this.dataSourceDetailsForm.valid) {
      return of('VALID');
    }
    return this.dataSourceDetailsForm.statusChanges.pipe(
      startWith(this.dataSourceDetailsForm.status),
      filter((value: FormControlStatus) => value !== 'PENDING'),
      first(),
    );
  }

  private _onRunTypeChanged(): void {
    this._setFormValidation();
  }

  private _setDataRetentionObj(): void {
    this.dataRetentionObj = null;
    const keys = Object.keys(this.dataRetentionInfoObj || {});
    if (!keys.length) {
      return;
    }
    setTimeout(() => {
      this.dataRetentionObj = this.dataRetentionService.getPerfectDataRetentionObj();
      this.cd.detectChanges();
    });
  }

  private _onSelectedDatasourceChanged(): void {
    this._setDataRetentionObj();
  }
}
