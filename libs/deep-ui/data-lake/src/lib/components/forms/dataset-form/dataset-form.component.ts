import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {getFutureDateFromNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BaseFormDirective} from 'deep-ui/shared/components/src/lib/forms';
import {DataRetentionService, DatasetService} from 'deep-ui/shared/core';
import {
  DataRetentionConfig,
  DataRetentionKnownKeysEnum,
  DataRetentionObj,
  Dataset,
  Datasource,
  SelectedSubQuery,
} from 'deep-ui/shared/models';
import _cloneDeep from 'lodash-es/cloneDeep';
import {Observable, Subject} from 'rxjs';
import {filter, first, startWith, switchMap} from 'rxjs/operators';

import {DataLakeFormValidations} from '../../../validators/validators';
import {ExpiredAtDataRetentionControlComponent} from '../../controls/expired-at-data-retention-control/expired-at-data-retention-control.component';
import {QueryDashboardControlComponent} from '../../controls/query-dashboard-control/query-dashboard-control.component';
import {DatasetFormService} from './dataset-form.service';

@UntilDestroy()
@Component({
  selector: 'de-dataset-form',
  templateUrl: './dataset-form.component.html',
  styleUrls: ['./dataset-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MeInputComponent,
    MeTextareaComponent,
    MeSelectComponent,
    MatIconModule,
    ReactiveFormsModule,
    MeTooltipDirective,
    MatFormFieldModule,
    MatCheckboxModule,
    QueryDashboardControlComponent,
    ExpiredAtDataRetentionControlComponent,
    MeFormControlChipsFieldComponent,
  ],
  providers: [DatasetFormService],
  animations: [MeFadeInOutAnimation],
})
export class DatasetFormComponent extends BaseFormDirective implements OnInit {
  @Input()
  subQueries: Array<SelectedSubQuery> = [];

  @Input()
  dataset: Dataset;

  @Input()
  selectedDataSources: Array<Datasource> = [];

  @Output()
  subQueriesChange = new EventEmitter<Array<SelectedSubQuery>>();

  @Output()
  selectedDataSourcesChange = new EventEmitter<Array<Datasource>>();

  @Output()
  addSubQueryClicked = new EventEmitter<void>();

  @Output()
  deleteSubQuery = new EventEmitter<number>();

  @Output()
  editSubQuery = new EventEmitter<SelectedSubQuery>();

  @Output()
  fromValueChanged = new EventEmitter<Partial<Dataset>>();

  private router = inject(Router);
  private datasetService = inject(DatasetService);
  private datasetFormService = inject(DatasetFormService);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);

  datasetForm = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    team: new FormControl('', {
      nonNullable: true,
      validators: Validators.compose([Validators.required]),
    }),
    description: new FormControl<string>('', {nonNullable: true}),
    queryDashboard: new FormControl(null, {
      validators: Validators.required,
      asyncValidators: [],
    }),
    tags: new FormControl<Array<string>>([]),
    dataRetention: new FormControl<any>(null),
  });

  initialDataset: Omit<Dataset, 'expirationDate'> & {dataRetention: DataRetentionObj};

  dataRetentionObj: DataRetentionObj;

  dataRetentionInfoObj: DataRetentionConfig;

  submitButtonTooltip: string;

  window = window;

  resetQuery = new Subject<void>();

  resetQuery$ = this.resetQuery.asObservable();

  private isFormValid = new Subject<void>();

  private dataRetentionService = inject(DataRetentionService);

  override ngOnInit(): void {
    super.ngOnInit();
    this._initForm();
    this._loadData();
    this._setDataRetentionConfigAndInfo();
    this.submitButtonTooltip = this._getSubmitTooltip();
  }

  getTeamProp(): string {
    return 'team';
  }

  getEntityType(): string {
    return 'dataset';
  }

  onSubmit(): void {
    this.datasetForm.controls.name.updateValueAndValidity();
    this.datasetForm.controls.queryDashboard.updateValueAndValidity();
    this.datasetForm.markAllAsTouched();
    this.isFormValid.next();
  }

  onBackButtonPressed(): void {
    const selected = this.dataset;
    if (selected) {
      this.router.navigate(['./data-lake/datasets'], {
        state: {selected},
      });
    } else {
      this.router.navigate(['./data-lake/datasets']);
    }
  }

  private _getSubmitTooltip(): string {
    if (this.dataset?.status === 'updating') {
      return 'The Dataset is currently being updated.';
    }
    if (
      this.formMode === 'edit' &&
      !this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(this.dataset, this.getTeamProp())
    ) {
      return `You are not allowed to edit the Dataset, only a member of the team: ${this.dataset.team} can delete this.`;
    }
    return '';
  }

  private _initForm(): void {
    this._setInitialFormState();
    this._setFormValidations();
  }

  private _setFormValidations(): void {
    const id = this.formMode === 'create' ? undefined : this.dataset?.id;
    this.datasetForm.controls.name.addAsyncValidators(
      DataLakeFormValidations.checkDatasetName(this.datasetService, id, this.cd),
    );
  }

  private _setInitialFormState(): void {
    const defaultTeam = this.getDefaultTeam();
    this.datasetForm.controls.team.setValue(defaultTeam);
  }

  private _loadData(): void {
    if (this.dataset) {
      const queryDashboardValue = {
        numberOfClips: this.dataset.numberOfClips,
        queryJson: this.dataset.queryJson,
        queryString: this.dataset.queryString,
        pathOnS3: this.dataset.pathOnS3,
      };
      const team = this.deepTeamOptions.includes(this.dataset.team) ? this.dataset.team : undefined;
      this.datasetForm.patchValue({
        name: this.dataset.name,
        team: team,
        tags: this.dataset.tags || [],
        description: this.dataset.description,
        queryDashboard: queryDashboardValue,
        dataRetention: {datasets: this.dataset.expirationDate},
      });
      this.initialDataset = _cloneDeep(this.datasetForm.getRawValue()) as any;
    }
  }

  private _setDataRetentionConfigAndInfo(): void {
    this.dataRetentionService.getDataRetentionConfig().subscribe((_: DataRetentionConfig) => {
      this.dataRetentionInfoObj = this.dataRetentionService.getDatasetDataRetentionConfig();
      this.dataRetentionObj = {
        [DataRetentionKnownKeysEnum.DATASETS]:
          this.dataset?.expirationDate ??
          toShortDate(
            getFutureDateFromNow(
              this.dataRetentionInfoObj[DataRetentionKnownKeysEnum.DATASETS].default,
              'days',
            ),
          ),
      };
      this.cd.detectChanges();
    });
  }

  // eslint-disable-next-line
  private isFormValidObj = this.isFormValid
    .asObservable()
    .pipe(switchMap(this._isFormValid.bind(this)), untilDestroyed(this));

  // eslint-disable-next-line
  private isFormValid$ = this.isFormValidObj.subscribe((status: string) => {
    if (status === 'VALID' && !!this.datasetForm.controls.queryDashboard?.value?.queryString) {
      let dataSet;
      if (this.formMode === 'edit') {
        dataSet = this.datasetFormService.getDirtyControls(this.datasetForm, this.initialDataset);
      } else {
        dataSet = this.datasetForm.value;
      }
      const queryDashboardValue: Partial<Dataset> =
        this.datasetFormService.serializeQueryDashboardValue(dataSet?.queryDashboard);
      const expirationDate: string = dataSet?.dataRetention?.[DataRetentionKnownKeysEnum.DATASETS];
      delete dataSet?.queryDashboard;
      delete dataSet?.dataRetention;
      const nextValue = {
        ...dataSet,
        ...queryDashboardValue,
      };
      if (expirationDate) {
        nextValue.expirationDate = expirationDate;
      }
      this.fromValueChanged.emit(Object.keys(nextValue).length ? nextValue : null);
    }
    this.cd.detectChanges();
  });

  private _isFormValid(): Observable<any> {
    return this.datasetForm.statusChanges.pipe(
      startWith(this.datasetForm.status),
      filter((value: FormControlStatus) => value !== 'PENDING'),
      first(),
    );
  }
}
