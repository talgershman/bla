import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormControlStatus,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogClose} from '@angular/material/dialog';
import {MatError} from '@angular/material/form-field';
import {MatRadioButton, MatRadioChange, MatRadioGroup} from '@angular/material/radio';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeUploadFileBtnComponent} from '@mobileye/material/src/lib/components/upload-file-btn';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SnakeCaseKeys} from 'deep-ui/shared/common';
import {DatasourceService, DeepUtilService} from 'deep-ui/shared/core';
import {Datasource, QEAttribute} from 'deep-ui/shared/models';
import {DataSourceFormValidations} from 'deep-ui/shared/validators';
import {Observable, of, Subject} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';

export enum GOLDEN_LABELS_FLOWS {
  EXISTING_DB = 'existing_db',
  CREATE_BLANK = 'create_blank',
}

export type GOLDEN_LABELS_FLOW = 'create' | 'updateSchema';

export type SchemaAttribute = SnakeCaseKeys<
  Pick<QEAttribute, 'columnType' | 'columnName' | 'values'>
>;

@UntilDestroy()
@Component({
  selector: 'de-create-golden-labels-data-source-dialog',
  templateUrl: './create-golden-labels-data-source-dialog.component.html',
  styleUrls: ['./create-golden-labels-data-source-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MeInputComponent,
    MeSelectComponent,
    MeFormControlChipsFieldComponent,
    MeTextareaComponent,
    MatError,
    MeJsonEditorComponent,
    MeUploadFileBtnComponent,
    MatRadioButton,
    MatRadioGroup,
    MatButton,
    MatDialogClose,
    MeSafePipe,
  ],
})
export class CreateGoldenLabelsDataSourceDialogComponent implements OnInit {
  flow: GOLDEN_LABELS_FLOW;

  selectedDatasource: Datasource;

  schema: Array<SchemaAttribute>;

  submitted = output<void>();

  private readonly DEFAULT_SCHEMA_PLACEHOLDER: Array<SchemaAttribute> = [
    {
      column_name: 'col1',
      column_type: 'array<string>',
    },
    {
      column_name: 'col2',
      column_type: 'string',
      values: ['val1', 'val2'],
    },
    {
      column_name: 'col3',
      column_type: 'string',
    },
    {
      column_name: 'col4',
      column_type: 'integer',
    },
  ] as const;

  form = new FormGroup(
    {
      name: new FormControl<string>('', {validators: [Validators.required]}),
      team: new FormControl<string>('', {validators: [Validators.required]}),
      tags: new FormControl<string[]>([]),
      dataSubType: new FormControl<string>('', {validators: [Validators.required]}),
      description: new FormControl<string>(''),
      schema: new FormControl<Array<SchemaAttribute>>(this.DEFAULT_SCHEMA_PLACEHOLDER, {
        validators: Validators.compose([
          Validators.required,
          MeFormValidations.isNotObject(this.DEFAULT_SCHEMA_PLACEHOLDER, true),
        ]),
      }),
      s3Path: new FormControl(null, {
        validators: Validators.compose([
          Validators.required,
          MeFormValidations.mustStartWith('s3://'),
        ]),
      }),
    },
    {
      asyncValidators: [this._validateSchema.bind(this), this._validateS3Path.bind(this)],
    },
  );

  deepTeamOptions: string[] = [];

  GOLDEN_LABELS_FLOWS = GOLDEN_LABELS_FLOWS;

  selectOption: GOLDEN_LABELS_FLOWS = GOLDEN_LABELS_FLOWS.EXISTING_DB;

  dataSubTypesOptions: Array<MeSelectOption> = [
    {
      id: 'clips',
      value: 'Clips',
    },
    {
      id: 'frames',
      value: 'Frames',
    },
    {
      id: 'events',
      value: 'Events',
    },
  ];

  errorFeedbackMsg = signal<string>('');

  private data = inject(MAT_DIALOG_DATA);
  private deepUtilService = inject(DeepUtilService);
  private datasourceService = inject(DatasourceService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  private isFormValid = new Subject<void>();

  isFormValidObj = this.isFormValid
    .asObservable()
    .pipe(switchMap(this._isFormValid.bind(this)), untilDestroyed(this));

  private isFormValid$ = this.isFormValidObj.subscribe((status: FormControlStatus) => {
    if (status === 'VALID') {
      this._onFormValid();
    }
  });

  ngOnInit(): void {
    this._initInputs();
    this._setDeepTeamOptions();
    this._setFormValidation();
    this._initForm();
  }

  onFileChanged(jsonData: any): void {
    this.errorFeedbackMsg.set('');
    if (jsonData) {
      this.form.controls.schema.setValue(jsonData);
    } else {
      this.errorFeedbackMsg.set('Invalid JSON');
    }
  }

  onSubmit(): void {
    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();
    setTimeout(() => this.isFormValid.next());
  }

  onSelectOptionChange(event: MatRadioChange): void {
    this.selectOption = event.value;
    this._addValidationAccordingToFlow();
  }

  private _validateS3Path(group: FormGroup): Observable<ValidationErrors | null> {
    const s3PathControl = group.get('s3Path');
    if (s3PathControl.disabled) {
      return of(null);
    }
    const s3PathControlValue = s3PathControl.value;
    const dataSubType = group.get('dataSubType').getRawValue();
    if (!s3PathControlValue || !dataSubType) {
      return of(null);
    }

    this.errorFeedbackMsg.set('');
    return s3PathControl.valueChanges.pipe(
      startWith(s3PathControlValue),
      debounceTime(200),
      distinctUntilChanged(),
      first(),
      switchMap((latestValue) => {
        return this.datasourceService
          .validateGoldenLabelsDatasourceS3Path(latestValue, dataSubType)
          .pipe(
            catchError((response: HttpErrorResponse) => {
              return of(response);
            }),
            map((response) => {
              if (response?.error) {
                const msg = `S3 data path error: ${response.error.error || response.error}`;
                this.errorFeedbackMsg.set(msg);
                return {error: ''} as ValidationErrors;
              }
              // Valid
              return null;
            }),
          );
      }),
    );
  }

  private _validateSchema(group: FormGroup): Observable<ValidationErrors> {
    const schemaControl = group.get('schema');
    if (schemaControl.disabled) {
      return of(null);
    }
    const schemaControlValue = schemaControl.value;
    const dataSubType = group.get('dataSubType').getRawValue();
    if (!schemaControlValue || !dataSubType) {
      return of(null);
    }

    this.errorFeedbackMsg.set('');
    return schemaControl.valueChanges.pipe(
      startWith(schemaControlValue),
      debounceTime(200),
      distinctUntilChanged(),
      first(),
      switchMap((latestValue) => {
        return this.datasourceService
          .validateGoldenLabelsDatasourceSchema(latestValue, dataSubType)
          .pipe(
            catchError((response: HttpErrorResponse) => {
              return of(response);
            }),
            map((response) => {
              if (!response) {
                //valid
                return null;
              }
              if ('error' in response) {
                if ('errors' in response.error) {
                  const msg = `Schema error:\n${(response.error.errors || [])
                    .map((error, index) => `${index + 1}: ${error}`)
                    .join('\n')}`;
                  this.errorFeedbackMsg.set(msg);
                  return {error: ''} as ValidationErrors;
                }
                const msg = `Schema error: ${response.error.error || response.error}`;
                this.errorFeedbackMsg.set(msg);
                return {error: ''} as ValidationErrors;
              }
              this.errorFeedbackMsg.set('Invalid validation response structure');
              return {error: ''} as ValidationErrors;
            }),
          );
      }),
    );
  }

  private _initInputs(): void {
    this.selectedDatasource = this.data.selectedDatasource;
    this.flow = this.data.flow;
    this.schema = this._filterRelevantKeysFromSchema(this.data.schema);
  }

  private _filterRelevantKeysFromSchema(schema: Array<QEAttribute>): any {
    if (!schema) {
      return;
    }
    return schema.map((item: QEAttribute) => {
      return {
        column_name: item.columnName,
        column_type: item.columnType,
        ...(item.values ? {values: item.values} : null),
      };
    });
  }

  private _addValidationAccordingToFlow(): void {
    switch (this.selectOption) {
      case GOLDEN_LABELS_FLOWS.CREATE_BLANK: {
        this.form.controls.s3Path.disable();
        this.form.controls.schema.enable();
        this.form.controls.schema.updateValueAndValidity();
        break;
      }
      case GOLDEN_LABELS_FLOWS.EXISTING_DB: {
        this.form.controls.schema.disable();
        this.form.controls.s3Path.enable();
        this.form.controls.s3Path.updateValueAndValidity();
        break;
      }
      default:
        // eslint-disable-next-line
        const exhaustiveCheck: never = this.selectOption;
        throw new Error(`Unhandled _addValidationAccordingToFlow case: ${exhaustiveCheck}`);
    }
  }

  private _initForm(): void {
    if (this.flow === 'create') {
      const defaultTeam = this._getDefaultTeam();
      this.form.controls.team.setValue(defaultTeam);
      this.form.controls.schema.setValue(this.DEFAULT_SCHEMA_PLACEHOLDER);
    } else {
      this.form.controls.schema.setValue(this.schema);
      this.form.controls.dataSubType.setValue(this.selectedDatasource.dataSubType);
    }
  }

  private _setDeepTeamOptions(): void {
    const teams = this.deepUtilService.getCurrentUserTeams();
    this.deepTeamOptions = teams;
  }

  private _getDefaultTeam(): string {
    if (this.deepTeamOptions?.length === 1) {
      return this.deepTeamOptions[0];
    }
    return '';
  }

  private _setFormValidation(): void {
    if (this.flow === 'create') {
      this.form.controls.name.setAsyncValidators([
        DataSourceFormValidations.checkDatasourceName(this.datasourceService, this.cd),
      ]);
    } else {
      // edit mode
      this.selectOption = GOLDEN_LABELS_FLOWS.CREATE_BLANK;
      this._disableAllExceptSchema();
    }

    this._addValidationAccordingToFlow();
  }

  private _disableAllExceptSchema(): void {
    for (const controlName in this.form.controls) {
      if (controlName !== 'schema') {
        this.form.controls[controlName].disable();
      }
    }
  }

  private _isFormValid(): Observable<FormControlStatus> {
    return this.form.statusChanges.pipe(
      startWith(this.form.status),
      filter((value: FormControlStatus) => value !== 'PENDING'),
      first(),
    );
  }

  private _onFormValid(): void {
    const formValue = this.form.value;
    let request: Observable<{id: string}>;
    if (this.flow === 'updateSchema') {
      request = this.datasourceService.updateGoldenLabelsDatasourceSchema(
        formValue.schema,
        this.selectedDatasource.id,
      );
    } else {
      request = this.datasourceService.createGoldenLabelsDatasource(formValue);
    }
    request
      .pipe(
        catchError((response: HttpErrorResponse) =>
          of({
            error: getErrorHtmlMsgFromResponse(response, false),
          }),
        ),
      )
      .subscribe((response) => {
        if (!response || 'id' in response) {
          this.submitted.emit();
          this.dialog.closeAll();
        } else {
          this.errorFeedbackMsg.set((response as any)?.error);
        }
      });
  }
}
