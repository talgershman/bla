import {NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormControlStatus,
  NgControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {prettyPrintJson} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Store} from '@ngrx/store';
import copy from 'copy-to-clipboard';
import {AppState, DatasetService, queryRunDatasetQueryErrorAction} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {Dataset, Datasource, QueryObject, SelectedSubQuery} from 'deep-ui/shared/models';
import {debounce} from 'lodash-decorators/debounce';
import _cloneDeep from 'lodash-es/cloneDeep';
import _find from 'lodash-es/find';
import _findIndex from 'lodash-es/findIndex';
import _some from 'lodash-es/some';
import {NgxMaskPipe} from 'ngx-mask';
import {OnChange} from 'property-watch-decorator';
import {Observable} from 'rxjs';
import {finalize, map, tap} from 'rxjs/operators';

import {
  QueryEngineService,
  ValidateQueryJsonResponse,
  ValidateQueryJsonResponseItem,
} from '../../../services/query-engine/query-engine.service';
import {
  ExecuteQueryMessage,
  ExecuteQueryWebSocketsManagerService,
} from '../../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {QuerySampleDialogComponent} from '../../dialogs/query-sample-dialog/query-sample-dialog.component';
import {
  DownloadClipListActionEnum,
  JumpFileActionEnum,
  QueryDashboardControlService,
  QuerySampleActionEnum,
} from './query-dashboard-control.service';
import {SubQuerySquareComponent} from './sub-query-square/sub-query-square.component';

@UntilDestroy()
@Component({
  selector: 'de-query-dashboard-control',
  templateUrl: './query-dashboard-control.component.html',
  styleUrls: ['./query-dashboard-control.component.scss'],
  imports: [
    NgxMaskPipe,
    MatProgressSpinnerModule,
    MatIconModule,
    MatMenuModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    HintIconComponent,
    MeTooltipDirective,
    MatButtonModule,
    MatDialogModule,
    SubQuerySquareComponent,
    NgTemplateOutlet,
  ],
  providers: [QueryDashboardControlService],
})
export class QueryDashboardControlComponent implements ControlValueAccessor, Validator, OnInit {
  @ViewChild('queryLoading', {static: true})
  queryLoadingTmpl: TemplateRef<any>;

  @ViewChild('queryEditor', {static: true})
  queryEditorTmpl: TemplateRef<any>;

  @ViewChild('queryResults', {static: true})
  queryResultsTmpl: TemplateRef<any>;

  @OnChange<void>('_onSubQueriesChanged')
  @Input()
  subQueries: Array<SelectedSubQuery> = [];

  @Input()
  selectedDataSources: Array<Datasource> = [];

  @Input()
  dataset: Dataset;

  @Input()
  resetQuery$: Observable<void>;

  @Output()
  cancelQueryClicked = new EventEmitter<void>();

  @Output()
  deleteSubQuery = new EventEmitter<number>();

  @Output()
  addSubQueryClicked = new EventEmitter<void>();

  @Output()
  editSubQuery = new EventEmitter<SelectedSubQuery>();

  @Output()
  isQueryRunning = new EventEmitter<boolean>();

  @Output()
  subQueriesChange = new EventEmitter<Array<SelectedSubQuery>>();

  @Output()
  selectedDataSourcesChange = new EventEmitter<Array<Datasource>>();

  queryContainerTmpl: TemplateRef<any>;

  queryEditorResultTmpl: TemplateRef<any>;

  ngControl = inject(NgControl, {optional: true, self: true})!;
  private queryDashboardControlService = inject(QueryDashboardControlService);
  private executeQueryWebSocketsManagerService = inject(ExecuteQueryWebSocketsManagerService);
  private queryEngineService = inject(QueryEngineService);
  private datasetService = inject(DatasetService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);
  private snackbar = inject(MeSnackbarService);
  private store = inject<Store<AppState>>(Store);

  constructor() {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  form = this.fb.group({
    queryJson: new FormControl<Array<SelectedSubQuery>>(null, {
      validators: Validators.required,
    }),
    pathOnS3: new FormControl<string>('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    queryString: new FormControl<string>('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    numberOfClips: new FormControl<number>(null, {
      validators: Validators.compose([Validators.required, Validators.min(1)]),
    }),
    tableName: new FormControl<string>('', {
      nonNullable: true,
    }),
    queryHasFrameIndicator: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
  });

  runQueryErrorMsg: string;

  queryActionButtonErrorMsg: string;

  multiFieldsJumpFileDocUrl = environment.multiFieldsJumpFileDocUrl;

  window = window;

  jumpFileS3Path: string;

  control: AbstractControl;

  isReadOnlyMode: boolean;

  private initialQueryObject: QueryObject;

  private _value: any;

  private _disabled: boolean;

  private _touched: boolean;

  private queryJsonControlStatus = toSignal<FormControlStatus>(
    this.form.controls.queryJson.statusChanges,
  );

  isActionButtonDisabled = computed(() => {
    const queryJsonControlStatus = this.queryJsonControlStatus();
    const currentQueryObject = this.queryDashboardControlService.getQueryObject(
      this.form.controls.queryJson.value,
    );

    return this.queryDashboardControlService.isActionButtonDisabled(
      this.isReadOnlyMode,
      this.initialQueryObject,
      currentQueryObject,
      queryJsonControlStatus,
    );
  });
  // eslint-disable-next-line
  _onTouched = () => {};

  // eslint-disable-next-line
  _onChange = (value: any) => {};

  ngOnInit(): void {
    this._initForm();
    this._initTemplates();
    this._loadData();
    this._loadLastQuery();
    this._registerEvents();
    this._setReadOnlyMode();
    this.form.markAsTouched();
    this.ngControl.control.setValidators([this.validate.bind(this)]);
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  writeValue(obj: any): void {
    if (obj) {
      this.form.patchValue({
        queryJson: obj.queryJson,
        queryString: obj.queryString,
        pathOnS3: obj.pathOnS3,
        tableName: obj.tableName,
        numberOfClips: obj.numberOfClips,
        queryHasFrameIndicator: obj.queryHasFrameIndicator,
      });
    }
    this._value = this.form.getRawValue();
    this.cd.detectChanges();
  }

  markAsTouched(): void {
    if (!this._touched) {
      this._onTouched();
      this._touched = true;
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.control = control;
    if (this.form.invalid) {
      return {
        isRequired: true,
      };
    }
    return null;
  }

  onAddSubQuery(): void {
    this.runQueryErrorMsg = '';
    this._resetLastQuery();
    this.addSubQueryClicked.emit();
  }

  cancelQuery(): void {
    const queryObject = this.queryDashboardControlService.getQueryObject(
      this.form.controls.queryJson.value,
    );
    this.executeQueryWebSocketsManagerService.closeConnection(queryObject);
    this.queryEditorResultTmpl = this.queryResultsTmpl;
    this._resetLastQuery();
    this.cancelQueryClicked.emit();
    this.isQueryRunning.emit(false);
  }

  getSubQueryDataSource(dataSourceId: string): Datasource {
    return _find(this.selectedDataSources, (ds: Datasource) => ds.id === dataSourceId);
  }
  onMaterializedUpdated(materialized: boolean, subQuery: SelectedSubQuery): void {
    subQuery.query.materialized = materialized;
    if (materialized) {
      subQuery.query.columns = [];
    }
    this._updateSubQueryObject();
  }
  onSubQueryFieldsUpdated(columns: Array<string>, subQuery: SelectedSubQuery): void {
    subQuery.query.columns = columns;
    if (columns.length) {
      subQuery.query.materialized = false;
    }
    this._updateSubQueryObject();
  }

  onDeleteSubQuery(index: number): void {
    this.runQueryErrorMsg = '';
    this.queryActionButtonErrorMsg = '';

    this.selectedDataSources.splice(index, 1);
    this.selectedDataSourcesChange.emit(this.selectedDataSources);
    this.subQueries.splice(index, 1);
    this.subQueries = [...this.subQueries];
    this.form.controls.queryJson.setValue(this.subQueries);
    this.subQueriesChange.emit(this.subQueries);

    this.deleteSubQuery.emit(index);
  }

  onEditSubQuery(subQuery: SelectedSubQuery): void {
    this.runQueryErrorMsg = '';
    this.queryActionButtonErrorMsg = '';
    this.editSubQuery.emit(subQuery);
  }

  copyToClipboard(value: any): void {
    copy(value);
    this.snackbar.onCopyToClipboard();
  }

  async previewDialogButtonClicked(): Promise<void> {
    const includesMaterialized = this._isQueryIncludesMaterialized();
    const {errorMsg, action} = this.queryDashboardControlService.handlePreviewDialogButtonClicked(
      this.form.controls.pathOnS3.value,
      includesMaterialized,
      this.form.controls.tableName.value,
      this.form.controls.numberOfClips.value,
      this.form.controls.queryHasFrameIndicator.value,
    );
    this.queryActionButtonErrorMsg = errorMsg;
    await this._handlePreviewDialogAction(action, false);
  }

  jumpFileButtonClicked(): void {
    const currentQueryObject = this.queryDashboardControlService.getQueryObject(
      this.form.controls.queryJson.value,
    );
    const includesMaterialized = this._isQueryIncludesMaterialized();

    const {errorMsg, action, jumpFileS3Path} =
      this.queryDashboardControlService.handleJumpFileButtonClicked(
        this.form.controls.pathOnS3.value as string,
        includesMaterialized,
        this.form.controls.tableName.value,
        this.form.controls.numberOfClips.value,
        this.form.controls.queryHasFrameIndicator.value,
        this.initialQueryObject,
        currentQueryObject,
        this.dataset,
        this.subQueries,
      );
    this.queryActionButtonErrorMsg = errorMsg;
    this.jumpFileS3Path = jumpFileS3Path;
    this._handleJumpFileAction(action, false);
  }

  async downloadClipListClicked(): Promise<void> {
    const currentQueryObject = this.queryDashboardControlService.getQueryObject(
      this.form.controls.queryJson.value,
    );
    const {errorMsg, action} =
      this.queryDashboardControlService.handleDownloadClipListButtonClicked(
        this.form.controls.tableName.value,
        this.form.controls.numberOfClips.value,
        this.dataset,
        this.initialQueryObject,
        currentQueryObject,
      );
    this.queryActionButtonErrorMsg = errorMsg;
    await this._handleDownloadClipListAction(action, false);
  }

  // eslint-disable-next-line
  @debounce(100)
  runQuery(fromCache = false, afterQueryFinishedCallback: Function = null): void {
    this._resetLastQuery();
    this._connectToExecuteQuery(fromCache, afterQueryFinishedCallback);

    const queryObject = this.queryDashboardControlService.getQueryObject(
      this.form.controls.queryJson.value,
    );
    // this will send the query once the connection is up or get the cache result
    const cacheResult = this.executeQueryWebSocketsManagerService.send(queryObject, fromCache);
    if (!cacheResult) {
      this.isQueryRunning.emit(true);
      this.queryEditorResultTmpl = this.queryLoadingTmpl;
    } else {
      this._onQueryMessageReceived(cacheResult);
      this._onQueryResponse('', afterQueryFinishedCallback);
    }
    this.cd.detectChanges();
  }

  private _setReadOnlyMode(): void {
    if (this.dataset?.source === 'dataset_client') {
      this.isReadOnlyMode = true;
    }
  }

  private _isQueryIncludesMaterialized(): boolean {
    return _some(this.subQueries, (subQuery: SelectedSubQuery) => subQuery.query.materialized);
  }

  private _updateSubQueryObject(): void {
    this.form.controls.queryJson.setValue(this.subQueries);
    this.subQueriesChange.emit(this.subQueries);
    this.form.controls.queryJson.setValue(this.subQueries);
    this._resetLastQuery();
  }

  private _registerEvents(): void {
    this.resetQuery$?.pipe(untilDestroyed(this)).subscribe(() => this._resetLastQuery());

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this._value = this._serializeData();
      this._onChange(this._value);
    });
  }

  private _serializeData(): any {
    return this.form.getRawValue();
  }

  private _loadLastQuery(): void {
    //ignore last query
    if (this.dataset?.numberOfClips === 0) {
      return;
    }
    const queryObject = this.queryDashboardControlService.getQueryObject(
      this.form.controls.queryJson.value,
    );
    const savedQuery = this.executeQueryWebSocketsManagerService.getConnection(queryObject);
    if (savedQuery?.results) {
      this._onQueryMessageReceived(savedQuery.results);
    } else if (savedQuery) {
      this.runQuery(true);
    }
  }

  private _initForm(): void {
    this._setFormValidations();
  }

  private _setFormValidations(): void {
    this.form.controls.queryJson.addValidators([
      Validators.required,
      (control: AbstractControl): ValidationErrors => {
        return this.queryDashboardControlService.validateQueryJson(control);
      },
    ]);
    this._addAsyncValidatorsToQueryJson();
  }

  private _addAsyncValidatorsToQueryJson(): void {
    this.form.controls.queryJson.addAsyncValidators([
      (control: AbstractControl): Observable<ValidationErrors | null> => {
        return this.queryEngineService.asyncValidationForQueryJson(control.value).pipe(
          tap((response: ValidateQueryJsonResponse) => {
            // eslint-disable-next-line
            for (const [index, _] of (this.subQueries || []).entries()) {
              this.subQueries[index].errorMsg = '';
              const invalidIndex = this._getInvalidIndexFromResponse(response, index);
              if (invalidIndex !== -1) {
                this.subQueries[index].errorMsg = response.invalid[invalidIndex].error;
              }
            }
          }),
          map((response: ValidateQueryJsonResponse) => {
            if (response.invalid.length) {
              return {
                invalid: true,
              };
            }
            return null;
          }),
          finalize(() => this.cd.detectChanges()),
        );
      },
    ]);
  }

  private _getInvalidIndexFromResponse(
    response: ValidateQueryJsonResponse,
    subQueryIndex: number,
  ): number {
    return _findIndex(
      response.invalid,
      (response: ValidateQueryJsonResponseItem) => response.index === subQueryIndex,
    );
  }

  private _loadData(): void {
    if (this.dataset) {
      this.form.patchValue({
        queryJson: this.dataset.queryJson,
        numberOfClips: this.dataset.numberOfClips,
        queryString: this.dataset.queryString,
        pathOnS3: this.dataset.pathOnS3,
      });
      const queryObject = this.queryDashboardControlService.getQueryObject(
        this.form.controls.queryJson.value,
      );
      this.initialQueryObject = _cloneDeep(queryObject);
    }
  }

  private _initTemplates(): void {
    this.queryContainerTmpl = this.queryEditorTmpl;
    this.queryEditorResultTmpl = this.queryResultsTmpl;
    this.isQueryRunning.emit(false);
  }

  private async _handleDownloadClipListAction(
    action: DownloadClipListActionEnum,
    afterQuery: boolean,
  ): Promise<void> {
    switch (action) {
      case DownloadClipListActionEnum.triggerActionButtonMenu: {
        const menuTriggerSelector = '[download-clip-list-trigger]';
        if (afterQuery) {
          this._triggerActionButtonMenuAfterQuery(menuTriggerSelector);
        } else {
          this._triggerActionButtonMenu(menuTriggerSelector);
        }
        break;
      }
      case DownloadClipListActionEnum.triggerRunQuery: {
        this.runQuery(false, async () => {
          await this._handleAfterQueryRunForDownloadClipList();
        });
        break;
      }
      case DownloadClipListActionEnum.proceedToDownloadQueryEngine: {
        await this.queryEngineService.downloadClipList(false, this.form.controls.tableName.value);
        break;
      }
      case DownloadClipListActionEnum.proceedToDownloadDataSet: {
        await this.datasetService.downloadClipList(this.dataset);
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = action;
        throw new Error(`Unhandled _handlePreviewDialogAction case: ${exhaustiveCheck}`);
      }
    }
  }

  private async _handlePreviewDialogAction(
    action: QuerySampleActionEnum,
    afterQuery: boolean,
  ): Promise<void> {
    switch (action) {
      case QuerySampleActionEnum.triggerActionButtonMenu: {
        const menuTriggerSelector = '[preview-example-trigger]';
        if (afterQuery) {
          this._triggerActionButtonMenuAfterQuery(menuTriggerSelector);
        } else {
          this._triggerActionButtonMenu(menuTriggerSelector);
        }
        break;
      }
      case QuerySampleActionEnum.triggerRunQuery: {
        this.runQuery(false, async () => {
          await this._handleAfterQueryRunForPreviewDialog();
        });
        break;
      }
      case QuerySampleActionEnum.triggerOpenQuerySample: {
        await this._openQuerySampleDialog();
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = action;
        throw new Error(`Unhandled _handlePreviewDialogAction case: ${exhaustiveCheck}`);
      }
    }
  }

  private _handleJumpFileAction(action: JumpFileActionEnum, afterQuery: boolean): void {
    switch (action) {
      case JumpFileActionEnum.triggerActionButtonMenu: {
        const menuTriggerSelector = '[jump-file-trigger]';
        if (afterQuery) {
          this._triggerActionButtonMenuAfterQuery(menuTriggerSelector);
        } else {
          this._triggerActionButtonMenu(menuTriggerSelector);
        }
        break;
      }
      case JumpFileActionEnum.triggerRunQuery: {
        this.runQuery(false, () => {
          this._handleAfterQueryRunForJumpFile();
        });
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = action;
        throw new Error(`Unhandled _handleJumpFileAction case: ${exhaustiveCheck}`);
      }
    }
  }

  private _onQueryMessageReceived(message: ExecuteQueryMessage): void {
    this.isQueryRunning.emit(false);
    if (message.status === 500) {
      this._handleErrorResponse(message);
    } else if (message.status === 400) {
      this.runQueryErrorMsg = message.error || 'Oops ! Something went wrong.';
    } else if (message.status === 200) {
      this._handleOKResponse(message);
    }
  }

  private _handleOKResponse(message: ExecuteQueryMessage): void {
    this.form.controls.pathOnS3.setValue(message.content.pathOnS3);
    this.form.controls.numberOfClips.setValue(message.content.statistics.numberOfClips);
    this.form.controls.queryString.setValue(message.content.queryString);
    this.runQueryErrorMsg = '';
    this.form.controls.tableName.setValue(message.content.tableName);
    this.form.controls.queryHasFrameIndicator.setValue(message.content.hasFrameIndicator);
  }

  private _handleErrorResponse(message: ExecuteQueryMessage): void {
    this.store.dispatch(
      queryRunDatasetQueryErrorAction({
        title: 'Error',
        status: 500,
        request: environment.executeQueryApi,
        response: message.error,
        json: message?.queryJson,
      }),
    );
    this.runQueryErrorMsg = 'Oops ! Something went wrong.';
  }

  private async _openQuerySampleDialog(): Promise<void> {
    await this._loadQuerySampleComponent();
    this.dialog.open(QuerySampleDialogComponent, {
      width: '72.5vw',
      height: '90vh',
      autoFocus: false,
      restoreFocus: false,
      data: {
        tableName: this.form.controls.tableName.value,
        numberOfClips: this.form.controls.numberOfClips.value,
      },
      panelClass: 'dialog-panel-wizard',
    });
  }

  private async _loadQuerySampleComponent(): Promise<void> {
    import('../../dialogs/query-sample-dialog/query-sample-dialog.component');
  }

  private _onQueryResponse(msg: string, afterQueryFinishedCallback?: Function): void {
    this.queryEditorResultTmpl = this.queryResultsTmpl;
    this.isQueryRunning.emit(false);
    if (msg && !this.runQueryErrorMsg && this.form.controls.numberOfClips.value === null) {
      this.runQueryErrorMsg = msg;
    }
    if (afterQueryFinishedCallback) {
      afterQueryFinishedCallback();
    }
    this.cd.detectChanges();
  }

  private _connectToExecuteQuery(
    fromCache = false,
    afterQueryFinishedCallback: Function = null,
  ): void {
    const queryObject = this.queryDashboardControlService.getQueryObject(
      this.form.controls.queryJson.value,
    );
    const queryRequest$ = this.executeQueryWebSocketsManagerService.connect(queryObject, fromCache);
    queryRequest$.pipe(untilDestroyed(this)).subscribe(
      (message: ExecuteQueryMessage) => {
        this._onQueryMessageReceived(message);
        this._onQueryResponse('', afterQueryFinishedCallback);
      },
      (error: CloseEvent) => {
        this._onQueryResponse(
          `some error occurred- reason: ${error.reason}, code ${error.code}, wasClean: ${error.wasClean}`,
          afterQueryFinishedCallback,
        );
      },
    );
  }

  private _onSubQueriesChanged(subQueries: Array<SelectedSubQuery>): void {
    this.form?.controls.queryJson.setValue(subQueries);
    if (this.form) {
      this._resetLastQuery();
    }
  }

  private async _handleAfterQueryRunForDownloadClipList(): Promise<void> {
    const {errorMsg, action} =
      this.queryDashboardControlService.handleAfterQueryRunForDownloadClipList(
        this.form.controls.tableName.value,
        this.form.controls.numberOfClips.value,
      );
    this.queryActionButtonErrorMsg = errorMsg;
    await this._handleDownloadClipListAction(action, true);
  }

  private async _handleAfterQueryRunForPreviewDialog(): Promise<void> {
    const {errorMsg, action} =
      this.queryDashboardControlService.handleAfterQueryRunForPreviewDialog(
        this.form.controls.queryHasFrameIndicator.value,
        this.form.controls.tableName.value,
        this.form.controls.numberOfClips.value,
      );
    this.queryActionButtonErrorMsg = errorMsg;
    await this._handlePreviewDialogAction(action, true);
  }

  private _resetLastQuery(): void {
    this.runQueryErrorMsg = '';
    this.form.controls.tableName.setValue('');
    this.form.controls.queryString.setValue('');
    this.form.controls.pathOnS3.setValue('');
    this.form.controls.numberOfClips.setValue(null);
  }

  private _handleAfterQueryRunForJumpFile(): void {
    const {jumpFileS3Path, action, errorMsg} =
      this.queryDashboardControlService.handleAfterQueryRunForJumpFile(
        this.form.controls.pathOnS3.value,
        this.form.controls.queryHasFrameIndicator.value,
        this.form.controls.tableName.value,
        this.form.controls.numberOfClips.value,
      );
    this.queryActionButtonErrorMsg = errorMsg;
    this.jumpFileS3Path = jumpFileS3Path;
    this._handleJumpFileAction(action, true);
  }

  //we need to run after the loading template switch back to the query results template
  private _triggerActionButtonMenuAfterQuery(menuTriggerSelector: string): void {
    setTimeout(() => {
      this._triggerActionButtonMenu(menuTriggerSelector);
    });
  }

  private _triggerActionButtonMenu(menuTriggerSelector: string): void {
    //click the trigger dynamic
    const elem = document.querySelector(menuTriggerSelector);
    if (elem) {
      elem.dispatchEvent(new MouseEvent('click'));
    }
  }

  copyQueryJson() {
    const queryJson = this.queryDashboardControlService.getQueryObject(
      this.form.controls.queryJson.value,
    );
    const prettyJson = prettyPrintJson(queryJson, true);
    copy(prettyJson);
    this.snackbar.onCopyToClipboard();
  }
}
