import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {Params} from '@angular/router';
import {
  MeChipsGroupButton,
  MeChipsGroupButtonsComponent,
} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy} from '@ngneat/until-destroy';
import {
  DatasourceSelectionChipData,
  SelectDatasourceSelectionsComponent,
} from 'deep-ui/shared/components/src/lib/selection/select-datasource/select-datasource-selections';
import {SelectPerfectDatasourceComponent} from 'deep-ui/shared/components/src/lib/selection/select-datasource/select-perfect-datasource';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {JobFormBuilderService} from 'deep-ui/shared/core';
import {DatasourceDeselectData, DataSourceSelection} from 'deep-ui/shared/models';
import _uniq from 'lodash-es/uniq';
import {Subject} from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'de-select-datasource',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select-datasource.component.html',
  styleUrl: './select-datasource.component.scss',
  imports: [
    MeChipsGroupButtonsComponent,
    SelectPerfectDatasourceComponent,
    SelectDatasourceSelectionsComponent,
  ],
})
export class SelectDatasourceComponent implements OnInit {
  selectedButtonId = input<DataSourceDynamicViewEnum>();
  selectedDataSources = input<Array<DataSourceSelection>>([]);
  datasourcesOptions = input<Array<MeChipsGroupButton>>([]);
  dataSourceSelectionsChanged = output<{
    selections: Array<DataSourceSelection>;
    type: DataSourceDynamicViewEnum;
  }>();
  selectionRemoved = output<DatasourceDeselectData>();

  chipsSelectionData = computed<Array<DatasourceSelectionChipData>>(() => {
    return this.selectedDataSources().map((selection: DataSourceSelection) => {
      return {
        name: selection.dataSource?.name,
        typeName: this.datasourcesOptions().find((option) => option.id === selection.type)?.label,
        type: selection.type,
        rowId: selection.version?.id ?? selection.dataSource.id,
        level: selection.version?.id !== undefined ? 1 : 0,
        userFacingVersion: selection.version?.userFacingVersion ?? 'latest',
        hideTypeName: this.datasourcesOptions().length < 2,
      };
    });
  });

  deSelectVersion = new Subject<DatasourceDeselectData>();
  isReTriggerFlow = signal<boolean>(false);

  readonly sessionKey = 'defaultSelectDataSourceView';
  selectedGroupButton: DataSourceDynamicViewEnum;

  private userPreferencesService = inject(MeUserPreferencesService);
  protected jobFormBuilderService = inject(JobFormBuilderService);

  uniqDataSourceTypes = computed(() =>
    _uniq(this.selectedDataSources().map((selection: DataSourceSelection) => selection.type)),
  );

  defaultViewId = computed<DataSourceDynamicViewEnum>(() => {
    const dsTypes = this.uniqDataSourceTypes();
    if (dsTypes.length > 0 && this.datasourcesOptions().some((opt) => opt.id === dsTypes[0])) {
      return dsTypes[0] as DataSourceDynamicViewEnum;
    }
    return DataSourceDynamicViewEnum.PERFECTS;
  });

  selectedPerfectDataSources = computed(() => {
    return this.selectedDataSources().filter(
      (selection: DataSourceSelection) => selection.type === DataSourceDynamicViewEnum.PERFECTS,
    );
  });

  uniqPerfectDataSourceIds = computed(() =>
    _uniq(
      this.selectedPerfectDataSources().map(
        (selection: DataSourceSelection) => selection.dataSource.id,
      ),
    ),
  );

  initialPerfectTableFilters = computed<Params>(() => {
    const dsIds = this.uniqPerfectDataSourceIds();
    if (dsIds.length === 1) {
      return {id: this.selectedPerfectDataSources()[0].dataSource.id};
    }

    return {};
  });

  // selectedMestDataSources = computed(() => {
  //   return this.selectedDataSources().filter(
  //     (selection: DataSourceSelection) => selection.type === DataSourceDynamicViewEnum.MESTS,
  //   );
  // });

  // uniqMestDataSourceIds = computed(() =>
  //   _uniq(
  //     this.selectedMestDataSources().map(
  //       (selection: DataSourceSelection) => selection.dataSource.id,
  //     ),
  //   ),
  // );

  // initialMestTableFilters = computed<Params>(() => {
  //   const dsIds = this.uniqMestDataSourceIds();
  //   if (dsIds.length === 1) {
  //     return {id: this.selectedMestDataSources()[0].dataSource.id};
  //   }
  //
  //   return {};
  // });

  viewState = computed(() => {
    return {
      selectedButtonId: this.selectedButtonId(),
      selectedDataSources: this.selectedDataSources(),
      datasourcesOptions: this.datasourcesOptions(),
      uniqDataSourceTypes: this.uniqDataSourceTypes(),
      defaultViewId: this.defaultViewId(),
      chipsSelectionData: this.chipsSelectionData(),
      perfects: {
        selectedDataSources: this.selectedPerfectDataSources(),
        initialTableFilters: this.initialPerfectTableFilters(),
      },
      // mests: {
      //   selectedDataSources: this.selectedMestDataSources(),
      //   initialTableFilters: this.initialMestTableFilters(),
      // },
    };
  });

  ngOnInit(): void {
    this.selectedGroupButton = this.viewState().selectedButtonId || this.viewState().defaultViewId;
    this.isReTriggerFlow.set(!!this.jobFormBuilderService.mainJob);
  }

  onGroupButtonChanged(groupButtonID: DataSourceDynamicViewEnum): void {
    this.userPreferencesService.addUserPreferences(this.sessionKey, groupButtonID);
    this.selectedGroupButton = groupButtonID;
  }

  onDataSourceSelectionsChanged(selections: Array<DataSourceSelection>): void {
    if (selections.length > 1) {
      const lastSelection = selections[selections.length - 1];
      const sameDsIndexes = this._findSameDataSourceIndexes(selections, lastSelection);

      for (const sameDsIndex of sameDsIndexes) {
        if (sameDsIndex > -1 && this._checkVersionMatch(selections, sameDsIndex, lastSelection)) {
          this._emitDeselectVersion(selections, sameDsIndex);
          return;
        }
      }
    }
    this.dataSourceSelectionsChanged.emit({
      selections,
      type: this.selectedGroupButton,
    });
  }

  onSelectionRemoved(selection: DatasourceSelectionChipData): void {
    const deSelectData: DatasourceDeselectData = {
      id: selection.rowId,
      level: selection.level,
      type: selection.type,
    };
    this.selectionRemoved.emit(deSelectData);
    this.deSelectVersion.next(deSelectData);
  }

  private _findSameDataSourceIndexes(
    selections: Array<DataSourceSelection>,
    lastSelection: DataSourceSelection,
  ): number[] {
    return selections
      .slice(0, selections.length - 1)
      .map((selection, index) => (selection.dataSource === lastSelection.dataSource ? index : -1))
      .filter((index) => index !== -1);
  }

  private _checkVersionMatch(
    selections: Array<DataSourceSelection>,
    sameDsIndex: number,
    lastSelection: DataSourceSelection,
  ): boolean {
    return (
      (!lastSelection.version || !selections[sameDsIndex].version) &&
      (lastSelection.version
        ? lastSelection.version.userFacingVersion ===
          selections[sameDsIndex].dataSource.latestUserVersion
        : lastSelection.dataSource.latestUserVersion ===
          selections[sameDsIndex].version?.userFacingVersion)
    );
  }

  private _emitDeselectVersion(selections: Array<DataSourceSelection>, sameDsIndex: number): void {
    this.deSelectVersion.next({
      id: selections[sameDsIndex].version?.id ?? selections[sameDsIndex].dataSource.id,
      level: selections[sameDsIndex].version?.id !== undefined ? 1 : 0,
      type: selections[sameDsIndex].type,
    });
  }
}
