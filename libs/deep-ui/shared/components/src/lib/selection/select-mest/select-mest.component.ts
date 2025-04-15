import {
  CheckboxSelectionCallback,
  Column,
  DisplayedColumnsChangedEvent,
} from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  NgZone,
  Output,
  signal,
  TemplateRef,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import {MatCheckboxChange, MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectChange} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {Params} from '@angular/router';
import {
  MeAgTableActionItemEvent,
  MeRowNode,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  CommonTableActions,
  DUPLICATE_ID_FIXED_APPEND,
  InitialMestSettings,
  SelectMestItem,
  ValidSelectedMest,
} from 'deep-ui/shared/components/src/lib/common';
import {SelectServerSideTableBaseDirective} from 'deep-ui/shared/components/src/lib/selection/common';
import {MestDatasource, MestFoundPathsResponse, MestService} from 'deep-ui/shared/core';
import {IfUserTeamDirective} from 'deep-ui/shared/directives/src/lib/if-user-team';
import {ClipList, MEST} from 'deep-ui/shared/models';
import {debounce} from 'lodash-decorators/debounce';
import _find from 'lodash-es/find';
import _findIndex from 'lodash-es/findIndex';
import _isNil from 'lodash-es/isNil';
import _remove from 'lodash-es/remove';
import {OnChange} from 'property-watch-decorator';
import {delay} from 'rxjs/operators';

import {SelectMestService} from './select-mest.service';
import {getMestTableColumns} from './select-mest-entities';

/*/
 if one rows is invalid -> then mest selections return an empty array.
 only if all rows that have input are valid -> returns the new selections.
 */
@UntilDestroy()
@Component({
  selector: 'de-select-mest',
  templateUrl: './select-mest.component.html',
  styleUrls: ['./select-mest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SelectMestService],
  imports: [
    MeServerSideTableComponent,
    MatIconModule,
    MeTooltipDirective,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MeInputComponent,
    ReactiveFormsModule,
    FormsModule,
    MatCheckboxModule,
    MeSelectComponent,
    MePortalSrcDirective,
    MatSlideToggle,
    HintIconComponent,
    IfUserTeamDirective,
  ],
})
export class SelectMestComponent extends SelectServerSideTableBaseDirective<SelectMestItem> {
  @ViewChild('rootPathCell', {static: true})
  rootPathTempRef: TemplateRef<any>;

  @ViewChild('isMainCell', {static: true})
  isMainTempRef: TemplateRef<any>;

  @ViewChild('clipListCell', {static: true})
  clipListTempRef: TemplateRef<any>;

  @ViewChild('nicknameCell', {static: true})
  nicknameTempRef: TemplateRef<any>;

  @ViewChild('localOutputCell', {static: true})
  localOutputTempRef: TemplateRef<any>;

  @ViewChild('templateNameCell', {static: true})
  templateNameTempRef: TemplateRef<any>;

  @Input()
  isShown: boolean;

  @Input()
  initialMestSettings: InitialMestSettings;

  @OnChange<void>('_onOverrideDisplayColumns')
  @Input()
  overrideDisplayColumns: Array<string> = [];

  @OnChange<void>('_onClipListsChanged')
  @Input()
  clipLists: Array<ClipList>;

  @Output()
  actionClicked = new EventEmitter<MeAgTableActionItemEvent<SelectMestItem>>();

  @Output()
  mestsSelectedChanged = new EventEmitter<ValidSelectedMest[]>();

  @Output()
  mainVersionChanged = new EventEmitter<SelectMestItem>();

  @OnChange<void>('_onUpdatedMest')
  @Input()
  updatedMest: SelectMestItem;

  @Output()
  gridReady = new EventEmitter<MeAgTableApiService<SelectMestItem>>();

  setDatasource = () => (this.agGridDataSource = new MestDatasource(this.mestService));

  clipListOptions: Array<MeSelectOption> = [];

  searchFilterByField = 'nickname';

  mainVersion: SelectMestItem;

  mestSyncLocalDirectoryColumnVisible: boolean;
  mestOutputsNicknameColumnVisible: boolean;

  readonly TOGGLE_NICKNAME_SUFFIX_PREFERENCE_KEY = 'toggleNickname';
  readonly TOGGLE_LOCAL_OUTPUT_SUFFIX_PREFERENCE_KEY = 'toggleLocalOutput';

  private selectMestService = inject(SelectMestService);
  private fb = inject(FormBuilder);
  private ngZone = inject(NgZone);
  clipListsControl = this.fb.group({});

  private validMestsArr: Array<ValidSelectedMest> = [];
  private mestService = inject(MestService);
  private activeTableColumns: Array<string> = [];

  readonly checkboxes: WritableSignal<boolean | CheckboxSelectionCallback> = signal(true);
  readonly hideTableActions = false;
  readonly checkboxProperty = 'nickname';
  readonly getTableColumnsDef = getMestTableColumns;
  readonly idProperty = 'id';
  readonly teamProperty = 'group';
  readonly ignoreTeamFilterAttributes = ['id'];
  readonly ignoredFiltersKeys = [];
  readonly reTriggerUniqFilterAttr = 'id';
  readonly pollingDataEnabled = false;

  ngOnInit(): void {
    this.initialSelectionId = this.initialMestSettings?.id;
    this._setClipListOptions();
    this._calcActiveTableColumns();
    this._setToggleColumnControlState();
    super.ngOnInit();
  }

  protected override registerEvents() {
    this.agGridDataSource.dataLoaded$
      .pipe(delay(350), untilDestroyed(this))
      .subscribe((rowData: Array<MEST>) => {
        this._initClipListControls(rowData);
        this.selectPreSelectedRow();
      });
  }

  protected override setTableOptions(): void {
    this.tableOptions = {
      templates: {
        isMainCell: this.isMainTempRef,
        clipListCell: this.clipListTempRef,
        rootPathCell: this.rootPathTempRef,
        nicknameCell: this.nicknameTempRef,
        localOutputCell: this.localOutputTempRef,
        templateNameCell: this.templateNameTempRef,
      },
      overrideColumns: [...this.activeTableColumns],
      showActions: !this.hideTableActions,
    };
  }

  async onActionClicked(actionEvent: MeAgTableActionItemEvent<SelectMestItem>): Promise<void> {
    if (actionEvent.id === CommonTableActions.DUPLICATE) {
      this._handleDuplicateAction(actionEvent);
    }
    this.actionClicked.emit(actionEvent);
  }

  async onActionClickedRunInZone(
    actionEvent: MeAgTableActionItemEvent<SelectMestItem>,
  ): Promise<void> {
    await this.ngZone.run(this.onActionClicked.bind(this, actionEvent));
  }

  onCellValueChanged(node: MeRowNode, mest: SelectMestItem): void {
    mest.rootPath = mest.rootPath?.trim();
    const rootPath = mest.rootPath;
    this._resetValidationProps(mest);
    if (!rootPath) {
      node.setSelected(false);
      this._handleNoRootPath(mest);
      return;
    }
    const isInvalidFilePath = MeFormValidations.isValidFilePath()({
      value: rootPath,
    } as any);
    if (isInvalidFilePath) {
      node.setSelected(false);
      mest.error = true;
      mest.validationTooltip = `Root path - ${isInvalidFilePath.isValidFilePath}`;
      this._removeMestFromValid(mest);
      this.gridApi.applyServerSideTransaction({
        update: [mest],
      });
      this.mestsSelectedChanged.emit([]);
      return;
    }
    this._sendValidationRequest(rootPath, mest, node);
  }

  onMainChange(change: MatCheckboxChange, selected: SelectMestItem): void {
    this.mainVersion = change.checked ? selected : null;
    this._sendSelectionChanged();
    this.mainVersionChanged.emit(this.mainVersion);
  }

  onLocalOutputChanged(node: MeRowNode, mest: SelectMestItem): void {
    if (!mest.rootPath?.trim()) {
      this._resetLocalOutput(mest);
    }
    if (mest.mestSyncLocalDirectory) {
      this.localOutputChanged(node, mest);
    } else {
      this.onCellValueChanged(node, mest);
    }
  }
  onRootPathChanged(node: MeRowNode, mest: SelectMestItem): void {
    if (!mest.rootPath?.trim()) {
      this._resetCustomNickname(mest);
    }
    if (mest.mestOutputsNickname) {
      this.onCustomNicknameChanged(node, mest);
    } else {
      this.onCellValueChanged(node, mest);
    }
  }

  onClipListSelected(node: MeRowNode, mest: SelectMestItem, event: MatSelectChange): void {
    this._updateMestClipList(event, mest);
    this._sendSelectionChanged();
  }

  onCustomNicknameChanged(node: MeRowNode, mest: SelectMestItem): void {
    mest.customNicknameInvalid = false;
    const value = mest.mestOutputsNickname?.trim();
    mest.mestOutputsNickname = value;
    const regExp = new RegExp(/^[a-zA-Z0-9_]*$/);
    if (value && !regExp.test(value)) {
      mest.customNicknameInvalid = true;
      node.setSelected(false);
      this._removeMestFromValid(mest);
      this.mestsSelectedChanged.emit([]);
    } else {
      this.onCellValueChanged(node, mest);
    }
  }

  localOutputChanged(node: MeRowNode, mest: SelectMestItem): void {
    mest.localOutputInvalid = false;
    mest.localOutputLoading = true;
    const value = mest.mestSyncLocalDirectory?.trim();
    this.mestService
      .validatePath(value)
      .pipe(delay(200), untilDestroyed(this))
      .subscribe((response: ValidationErrors) => {
        mest.localOutputLoading = false;
        if (response?.error) {
          mest.localOutputInvalid = true;
          node.setSelected(false);
          this._removeMestFromValid(mest);
          this.mestsSelectedChanged.emit([]);
        } else {
          this.onCellValueChanged(node, mest);
        }
      });
  }

  onColumnSliderChange(
    columnId: string,
    userPreferencesKey: string,
    ignoreUserPrefSave = false,
    forceValue: boolean = null,
  ): void {
    const displayedColumns = this.gridApi.getAllDisplayedColumns();
    const found = displayedColumns.find((column: Column) => column.getId() === columnId);
    this._applyFlexColumnState();
    this.gridApi.setColumnsVisible([columnId], !found);
    const nextValue = forceValue || !found;
    const keyAttr = `${columnId}ColumnVisible`;
    this[keyAttr] = nextValue;
    if (ignoreUserPrefSave) {
      const userPrefKey = this._getToggleUserPrefKey(userPreferencesKey);
      this.userPreferencesService.setComponentState(userPrefKey, nextValue);
    }
  }

  onDisplayedColumnChanged(_: DisplayedColumnsChangedEvent): void {
    const nickNameState = this.gridApi.getColumn('mestOutputsNickname').isVisible();
    this._setNicknameToggleState(nickNameState);
    const localOutputState = this.gridApi.getColumn('mestSyncLocalDirectory').isVisible();
    this._setLocalOutputToggleState(localOutputState);
    //reset the fields if hidden
    this._removeColumnsFromValidMests(nickNameState, localOutputState);
  }
  onFirstDataRenderedEvent(): void {
    if (this.initialMestSettings?.mest_outputs_nickname) {
      this.onColumnSliderChange(
        'mestOutputsNickname',
        this.TOGGLE_NICKNAME_SUFFIX_PREFERENCE_KEY,
        true,
        true,
      );
    }

    if (this.initialMestSettings?.mest_sync_local_directory) {
      this.onColumnSliderChange(
        'mestSyncLocalDirectory',
        this.TOGGLE_LOCAL_OUTPUT_SUFFIX_PREFERENCE_KEY,
        true,
        true,
      );
    }
  }

  onFiltersParamsChanged(params: Params = {}): void {
    if (this.isReTriggerFlow && Object.keys(params).length === 0) {
      this._clearAllSelectedRows();
    }
  }

  protected selectPreSelectedRow(): void {
    if (_isNil(this.initialSelectionId) || this.preSelected) {
      return;
    }

    const rowNode = this.gridApi.getRowNode(this.initialSelectionId.toString());
    if (!rowNode || !rowNode.displayed) {
      return;
    }

    if (rowNode.selectable && !rowNode.isSelected()) {
      this.preSelected = true;
      const mest: SelectMestItem = rowNode.data;
      mest.rootPath = this.initialMestSettings?.root_path;
      mest.mestSyncLocalDirectory = this.initialMestSettings?.mest_sync_local_directory;
      mest.mestOutputsNickname = this.initialMestSettings?.mest_outputs_nickname;
      this.gridApi.applyServerSideTransaction({
        update: [mest],
      });
      this.onCellValueChanged(rowNode as any, mest);
    }
  }

  private _applyFlexColumnState(): void {
    const current = [...this.gridApi.getColumnState()];
    const newCurrent = [];
    for (const state of current) {
      const colDef = this.columns.find(
        (col) => col.colId === state.colId || col.field === state.colId,
      );
      if (colDef?.flex) {
        newCurrent.push({
          ...state,
          flex: colDef.flex,
        });
      } else {
        newCurrent.push({
          ...state,
        });
      }
    }
    this.gridApi.applyColumnState({
      state: newCurrent,
      applyOrder: true,
    });
  }

  private _removeColumnsFromValidMests(nickNameState: boolean, localOutputState: boolean): void {
    for (const mest of this.validMestsArr) {
      let shouldUpdateTable = false;
      if (!nickNameState && mest.mestOutputsNickname) {
        mest.mestOutputsNickname = '';
        shouldUpdateTable = true;
      }
      if (!localOutputState && mest.mestSyncLocalDirectory) {
        mest.mestSyncLocalDirectory = '';
        shouldUpdateTable = true;
      }
      if (shouldUpdateTable) {
        const node = this.gridApi.getRowNode(mest.id.toString());
        const foundMest = node.data;
        const updatedMest = {
          ...foundMest,
          mestOutputsNickname: mest.mestOutputsNickname,
          mestSyncLocalDirectory: mest.mestSyncLocalDirectory,
        };
        this.gridApi.applyServerSideTransaction({
          update: [updatedMest],
        });
        this.gridApi.refreshCells({rowNodes: [node], force: true});
      }
    }
  }

  private _isRowValid(mest): boolean {
    return mest.isValid && !mest.customNicknameInvalid;
  }

  private _updateMestClipList(event: MatSelectChange, mest: SelectMestItem): void {
    let clipList = null;
    if (event.value) {
      clipList = _find(this.clipLists, (clip: ClipList) => clip.id.toString() === event.value);
    }
    const validMest = _find(
      this.validMestsArr,
      (validMest: ValidSelectedMest) => validMest.id === mest.id,
    );
    if (validMest) {
      validMest.clipList = clipList;
    }
  }

  @debounce(200)
  private _sendValidationRequest(
    rootPath: string,
    mest: SelectMestItem,
    node: MeRowNode<any>,
  ): void {
    mest.isLoading = true;
    this.mestService
      .getMestSelectedPaths(rootPath, mest.executables, mest.libs, mest.brainLibs)
      .pipe(delay(200))
      .subscribe((response: MestFoundPathsResponse) => {
        mest.isLoading = false;
        const dynamicErrorMsg = this.selectMestService.generateDynamicPathsError(
          response.executable?.errorMsg,
          response.lib?.errorMsg,
          response.brainLib?.errorMsg,
        );
        // valid
        if (dynamicErrorMsg.length === 0) {
          this._handleValidMestResponse(node, mest, response);
          return;
        }
        //invalid
        this._handleInvalidMestResponse(node, mest, dynamicErrorMsg);
      });
  }

  private _handleInvalidMestResponse(
    node: MeRowNode<any>,
    mest: SelectMestItem,
    dynamicErrorMsg: string,
  ): void {
    mest.validationTooltip = `Could not generate MEST CMD from root path. Error - could not find paths for: ${dynamicErrorMsg}.\n
For more info about the errors please click the 3 dots menu in the table row, then click "Modify temporary".`;
    mest.error = true;
    this._removeMestFromValid(mest);
    this.gridApi.applyServerSideTransaction({
      update: [mest],
    });
    node.setSelected(false);
    this.mestsSelectedChanged.emit([]);
    this.cd.detectChanges();
  }

  private _handleValidMestResponse(
    node: MeRowNode<any>,
    mest: SelectMestItem,
    response: MestFoundPathsResponse,
  ): void {
    mest.isValid = true;
    const mestCmd = this.mestService.generateMestCmd(
      mest,
      response.executable?.foundPath,
      response.lib?.foundPath,
      response.brainLib?.foundPath,
    );
    mest.validationTooltip = mestCmd;
    const validMest = this.selectMestService.convertToValidMest(
      mest,
      response,
      this.clipListsControl.value,
      this.clipLists,
    );
    this._addToValidMests(validMest);
    this.gridApi.applyServerSideTransaction({
      update: [mest],
    });
    const isRowValid = this._isRowValid(mest);
    node.setSelected(isRowValid);
    this._sendSelectionChanged();
    this.cd.detectChanges();
  }

  private _addToValidMests(addedMest: ValidSelectedMest): void {
    const index = _findIndex(
      this.validMestsArr,
      (mest: ValidSelectedMest) => mest.id === addedMest.id,
    );
    const clipList = this.selectMestService.getClipListFromControl(
      addedMest.id,
      this.clipLists,
      this.clipListsControl.value,
    );

    const mergedMest = {
      ...addedMest,
      clipList,
    };
    if (index === -1) {
      this.validMestsArr.push(mergedMest);
    } else {
      this.validMestsArr[index] = mergedMest;
    }
  }

  private _removeMestFromValid(removedMest: MEST): void {
    const index = this._getIndexOfMestInValidMestArr(removedMest);
    if (index !== -1) {
      this.validMestsArr.splice(index, 1);
    }
  }

  private _getIndexOfMestInValidMestArr(removedMest: MEST): number {
    return _findIndex(this.validMestsArr, (mest: ValidSelectedMest) => mest.id === removedMest.id);
  }

  private _onOverrideDisplayColumns(): void {
    if (this.overrideDisplayColumns.length) {
      setTimeout(() => {
        this.setTableColumns();
      });
    }
  }

  private _initClipListControls(mests: Array<MEST>): void {
    if (!this.clipListOptions.length) {
      return;
    }
    const defaultValue = this.clipListOptions.length === 1 ? this.clipListOptions[0] : null;
    for (const mest of mests) {
      //check if exists
      if (this.clipListsControl?.value[mest.id.toString()]) {
        //update exiting
        this.clipListsControl.controls[mest.id].setValue(defaultValue);
      } else {
        //create a new control
        this.clipListsControl.addControl(mest.id.toString(), new FormControl(defaultValue));
      }
    }
    //to show the clip list dropdown, we must trigger change detection again
    this.cd.detectChanges();
  }

  private _calcActiveTableColumns(): void {
    this.activeTableColumns = [...this.overrideDisplayColumns];
    if (
      !this.selectMestService.shouldIncludeClipListColumn(
        this.overrideDisplayColumns,
        this.clipListOptions,
      )
    ) {
      _remove(this.activeTableColumns, (value) => value === 'clipList');
    }
  }

  private _onUpdatedMest(mest: SelectMestItem): void {
    if (mest) {
      const node = this.gridApi.getRowNode(mest.id.toString());
      const foundMest = node.data;
      const updatedMest = {
        ...foundMest,
        ...mest,
      };
      if (!this.selectMestService.isOnlyMestRootPathChanged(updatedMest, foundMest)) {
        updatedMest.isOverride = true;
      }
      this.gridApi.applyServerSideTransaction({
        update: [updatedMest],
      });
      this.gridApi.refreshCells({rowNodes: [node], force: true});
      const updateNode = this.gridApi.getRowNode(mest.id.toString());
      this.onCellValueChanged(updateNode as MeRowNode, updateNode.data);
    }
  }

  private _onClipListsChanged(): void {
    this._setClipListOptions();
    this._calcActiveTableColumns();
    this.setTableOptions();
    this.setTableColumns();
    this._sendSelectionChanged();
    this.gridApi?.setGridOption('columnDefs', this.columns);
  }

  private _setClipListOptions(): void {
    const arr: MeSelectOption[] = [];
    for (const clip of this.clipLists || []) {
      arr.push({
        id: clip.id.toString(),
        value: clip.name,
      });
    }
    this.clipListOptions = arr;
  }

  private _sendSelectionChanged(): void {
    for (const mest of this.validMestsArr) {
      if (
        this.selectMestService.shouldIncludeClipListColumn(
          this.overrideDisplayColumns,
          this.clipListOptions,
        ) &&
        !mest.clipList
      ) {
        this.mestsSelectedChanged.emit([]);
        return;
      }
    }
    this.mestsSelectedChanged.emit(this.validMestsArr);
  }

  private _handleDuplicateAction(actionEvent: MeAgTableActionItemEvent<SelectMestItem>): void {
    //create a new uniq ID§
    const newId =
      actionEvent.selected.id + Math.floor(Math.random() * DUPLICATE_ID_FIXED_APPEND + 1);
    const duplicateMest = {
      ...actionEvent.selected,
      isOverride: true,
      id: newId,
    };
    delete duplicateMest.rootPath;
    delete duplicateMest.isValid;
    delete duplicateMest.validationTooltip;
    delete duplicateMest.error;
    this._addClipListControl(duplicateMest.id);
    this.gridApi.applyServerSideTransaction({
      add: [duplicateMest],
    });
  }

  private _addClipListControl(mestId: number): void {
    if (this.clipListOptions.length) {
      const defaultValue = this.clipListOptions.length === 1 ? this.clipListOptions[0] : null;
      this.clipListsControl.addControl(mestId.toString(), new FormControl(defaultValue));
    }
  }

  private _handleNoRootPath(mest: SelectMestItem): void {
    this._removeMestFromValid(mest);
    this.gridApi.applyServerSideTransaction({
      update: [mest],
    });
    this._sendSelectionChanged();
  }

  private _resetCustomNickname(mest: SelectMestItem): void {
    mest.mestOutputsNickname = '';
    mest.customNicknameInvalid = false;
  }

  private _resetLocalOutput(mest: SelectMestItem): void {
    mest.mestSyncLocalDirectory = '';
    mest.localOutputInvalid = false;
    mest.localOutputLoading = false;
  }

  private _resetValidationProps(mest: SelectMestItem): void {
    mest.isValid = null;
    mest.error = null;
    mest.validationTooltip = null;
  }

  private _setToggleColumnControlState(): void {
    const nickNameKey = this._getToggleUserPrefKey(this.TOGGLE_NICKNAME_SUFFIX_PREFERENCE_KEY);
    const nickNameToggleState = this.userPreferencesService.getComponentState(nickNameKey);
    this.mestOutputsNicknameColumnVisible = nickNameToggleState ?? false;

    const localOutputKey = this._getToggleUserPrefKey(
      this.TOGGLE_LOCAL_OUTPUT_SUFFIX_PREFERENCE_KEY,
    );
    const localOutputState = this.userPreferencesService.getComponentState(localOutputKey);
    this.mestSyncLocalDirectoryColumnVisible = localOutputState ?? false;
  }

  private _getToggleUserPrefKey(userPreferencesKey: string): string {
    return `${this.tableComponentId}-${userPreferencesKey}`;
  }

  private _setNicknameToggleState(value: boolean, ignoreSaveToUserPref = false): void {
    this.mestOutputsNicknameColumnVisible = value;
    if (!ignoreSaveToUserPref) {
      const key = this._getToggleUserPrefKey(this.TOGGLE_NICKNAME_SUFFIX_PREFERENCE_KEY);
      this.userPreferencesService.setComponentState(key, value);
    }
  }

  private _setLocalOutputToggleState(value: boolean, ignoreSaveToUserPref = false): void {
    this.mestSyncLocalDirectoryColumnVisible = value;
    if (!ignoreSaveToUserPref) {
      const key = this._getToggleUserPrefKey(this.TOGGLE_LOCAL_OUTPUT_SUFFIX_PREFERENCE_KEY);
      this.userPreferencesService.setComponentState(key, value);
    }
  }

  private _clearAllSelectedRows() {
    this.gridApi.deselectAll();
    this.validMestsArr = [];
    this.mestsSelectedChanged.emit(this.validMestsArr);
  }
}
