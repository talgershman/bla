import {ChangeDetectionStrategy, Component, inject, Input, OnInit, signal} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioChange, MatRadioModule} from '@angular/material/radio';
import {MatSelectChange} from '@angular/material/select';
import {MeGroupButton} from '@mobileye/material/src/lib/common';
import {MeChipsGroupButton} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DatasourceTablesControlComponent} from 'deep-ui/shared/components/src/lib/controls/datasource-tables-control';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {AssetManagerService, DatasourceService, DeepUtilService} from 'deep-ui/shared/core';
import {
  AllowedStatuesForQuery,
  Datasource,
  DataSourceSelection,
  VersionDataSource,
} from 'deep-ui/shared/models';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _intersection from 'lodash-es/intersection';
import _isNil from 'lodash-es/isNil';
import {OnChange} from 'property-watch-decorator';
import {firstValueFrom} from 'rxjs';
import {distinctUntilChanged, startWith} from 'rxjs/operators';

export type PERFECT_OPTIONS_TYPES = 'Data sources' | 'FPA perfects';
export const PERFECT_OPTIONS_ALLOWED_TEAMS_FPA_PERFECTS = ['deep-admin', 'deep-fpa-objects'];
export const RE_TRIGGER_SELECTED_VERSION_KEY = 'selected_version';
export const RE_TRIGGER_DATASOURCE_VERSION_KEY = 'datasource_version';
export const RE_TRIGGER_PERFECT_DATA_SOURCES_KEY = 'perfect_data_sources';

@UntilDestroy()
@Component({
  selector: 'de-datasources-step',
  templateUrl: './datasources-step.component.html',
  styleUrl: './datasources-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatRadioModule,
    MeSelectComponent,
    DatasourceTablesControlComponent,
    MatProgressSpinnerModule,
  ],
})
export class DatasourcesStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  @OnChange<void>('_onShown')
  wasShown: boolean;

  private deepUtilService = inject(DeepUtilService);
  private fb = inject(FormBuilder);
  private assetManagerService = inject(AssetManagerService);
  private datasourceService = inject(DatasourceService);
  private fullStoryService = inject(FullStoryService);

  fpaPerfectsOptions: MeSelectOption[];
  perfectsOptions: Array<MeGroupButton> = [
    {
      id: 'Data sources',
      label: 'Data sources',
    },
  ];
  readonly datasourcesOptions: Array<MeChipsGroupButton> = [
    {
      label: 'Perfects',
      id: DataSourceDynamicViewEnum.PERFECTS,
    },
    // {
    //   label: 'MEST',
    //   id: DataSourceDynamicViewEnum.MESTS,
    // },
  ];

  dataSourcesForm = this.fb.group(
    {
      fpaPerfects: this.jobFormBuilderService.createNewFormControl<null>(null, 'technology'),
      dataSources: new FormControl<Array<DataSourceSelection>>([]),
    },
    {
      validators: (form: FormGroup): ValidationErrors => {
        return form.get('fpaPerfects').value || !this._isDataSourceControlEmpty(form)
          ? null
          : {isValid: false};
      },
    },
  );

  initialPerfectOption: PERFECT_OPTIONS_TYPES = this.dataSourcesForm.controls.fpaPerfects.value
    ? 'FPA perfects'
    : 'Data sources';

  selectedPerfectOption: PERFECT_OPTIONS_TYPES = 'Data sources';

  initialized = signal<boolean>(false);

  private initialFpaPerfectsValue = this.dataSourcesForm.controls.fpaPerfects.value;
  private initialDataSourcesValue: Array<DataSourceSelection> =
    this.dataSourcesForm.controls.dataSources.value;

  async ngOnInit(): Promise<void> {
    super.ngOnInit();
    this._setPerfectOptions();
    this._setFpaPerfectsOptions();
    await this._setDataSourceControl();
    this._registerEvents();
    this.initialized.set(true);
  }

  onPerfectOptionChange(option: MatRadioChange): void {
    this.selectedPerfectOption = option.value.id;
    if (this.selectedPerfectOption === 'FPA perfects') {
      this._resetDataSourcesControls();
    } else if (this.selectedPerfectOption === 'Data sources') {
      this._resetFpaPerfectsControl();
    }
  }

  onFpaPerfectsChanged(_: MatSelectChange): void {
    this.fullStoryService.trackEvent({
      name: 'UI - FPA perfects selection changed',
      properties: {},
    });
  }

  private _onShown(): void {
    if (this.wasShown) {
      this.selectedPerfectOption = this.initialPerfectOption;
      this._resetDataSourcesControls();
      this._resetFpaPerfectsControl();
    }
  }

  private _setPerfectOptions(): void {
    const teams = this.deepUtilService.getCurrentUserTeams();
    const intersection = _intersection(teams, PERFECT_OPTIONS_ALLOWED_TEAMS_FPA_PERFECTS);
    if (intersection?.length) {
      this.perfectsOptions = [
        {
          id: 'Data sources',
          label: 'Data sources',
        },
        {
          id: 'FPA perfects',
          label: 'FPA perfects',
        },
      ];
    } else {
      this.perfectsOptions = [
        {
          id: 'Data sources',
          label: 'Data sources',
        },
      ];
    }
  }

  private _isDataSourceControlEmpty(form: FormGroup): boolean {
    return (
      _filter(form.get('dataSources').value || [], (item) => !!item?.dataSource?.id).length === 0
    );
  }

  private _setFpaPerfectsOptions(): void {
    this.assetManagerService.getTechnologiesOptions().subscribe((options) => {
      this.fpaPerfectsOptions = options;
    });
  }

  private async _setDataSourceControl(): Promise<void> {
    const reTriggerArrValue =
      this.jobFormBuilderService.getValue(RE_TRIGGER_PERFECT_DATA_SOURCES_KEY) || [];
    if (!reTriggerArrValue.length) {
      return null;
    }
    const value = [];
    for (const item of reTriggerArrValue) {
      let dataSource = item as Datasource;
      //check if new format
      if (RE_TRIGGER_DATASOURCE_VERSION_KEY in dataSource) {
        const userFacingVersion = dataSource?.[RE_TRIGGER_DATASOURCE_VERSION_KEY] as string;
        const dataSourceVersion = _find(
          dataSource.datasourceversionSet,
          (version: VersionDataSource) => version.userFacingVersion === userFacingVersion,
        );
        const isLatest = dataSource?.[RE_TRIGGER_SELECTED_VERSION_KEY] === 'latest';
        try {
          dataSource = await this._convertReTriggerModelToDataSourceModel(dataSource);
          if (AllowedStatuesForQuery.includes(dataSource.status)) {
            const item = this._createDataSourceValueItem(dataSource, dataSourceVersion, isLatest);
            if (!_isNil(item)) {
              value.push(item);
            }
          }
          // eslint-disable-next-line
        } catch (err) {}
      } else {
        //old format where only the DS ( AKA the parent) was saved
        const item = this._createDataSourceValueItem(dataSource, null, true);
        if (!_isNil(item)) {
          value.push(item);
        }
      }
    }
    this.dataSourcesForm.controls.dataSources.setValue(value);
    this.initialDataSourcesValue = value;
    return null;
  }

  private _resetFpaPerfectsControl(): void {
    this.dataSourcesForm.controls.fpaPerfects.setValue(this.initialFpaPerfectsValue || null);
  }

  private _resetDataSourcesControls(): void {
    this.dataSourcesForm.controls.dataSources.setValue(this.initialDataSourcesValue || []);
  }

  private _createDataSourceValueItem(
    dataSource: Datasource,
    version: VersionDataSource,
    isLatest: boolean,
    dsType: DataSourceDynamicViewEnum = DataSourceDynamicViewEnum.PERFECTS,
  ): DataSourceSelection {
    const currentVersion = isLatest ? null : version;
    if (dataSource.status === 'updating') {
      return null;
    }
    return {
      dataSource,
      version: currentVersion,
      type: dsType,
    };
  }

  private _convertReTriggerModelToDataSourceModel(
    dataSource: Datasource & {datasource_version: unknown},
  ): Promise<Datasource> {
    delete dataSource[RE_TRIGGER_DATASOURCE_VERSION_KEY];
    delete dataSource[RE_TRIGGER_SELECTED_VERSION_KEY];
    return firstValueFrom(this.datasourceService.getSingle(dataSource.id, {}, true));
  }

  private _registerEvents(): void {
    this.dataSourcesForm.statusChanges
      .pipe(
        startWith<FormControlStatus>(this.dataSourcesForm.status),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((value: FormControlStatus) => {
        this.formState.emit(value);
      });
  }
}
