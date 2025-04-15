import {CdkStepperModule} from '@angular/cdk/stepper';
import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DatasourceService, VersionDatasourceService} from 'deep-ui/shared/core';
import {
  Datasource,
  QEAttribute,
  SelectedSubQuery,
  SubQuery,
  VersionDataSource,
} from 'deep-ui/shared/models';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _findIndex from 'lodash-es/findIndex';
import _isEqual from 'lodash-es/isEqual';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import {finalize, map} from 'rxjs/operators';

import {QueryBuilderComponent} from '../../query-builder/query-builder.component';
import {
  DataSourceSelectionItem,
  SelectDatasourceComponent,
} from '../../selection/select-datasource/select-datasource.component';
import {StepperContainerComponent} from '../stepper-container/stepper-container.component';

@UntilDestroy()
@Component({
  selector: 'de-query-stepper',
  templateUrl: './query-stepper.component.html',
  styleUrls: ['./query-stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StepperContainerComponent,
    CdkStepperModule,
    SelectDatasourceComponent,
    AsyncPipe,
    QueryBuilderComponent,
  ],
})
export class QueryStepperComponent implements OnInit {
  @ViewChild('stepper')
  stepper: MatStepper;

  @Input()
  isReadOnlyMode: boolean;

  @Input()
  subQueries: Array<SelectedSubQuery> = [];

  @Input()
  selectedDataSources: Array<Datasource> = [];

  @Input()
  triggerEditSubQuery$: Observable<SelectedSubQuery>;

  @Input()
  triggerFirstStep$: Observable<void>;

  @Output()
  subQueriesChange = new EventEmitter<Array<SubQuery>>();

  @Output()
  selectedDataSourcesChange = new EventEmitter<Array<Datasource>>();

  @Output()
  movedBackedFromStepper = new EventEmitter<void>();

  private datasourceService = inject(DatasourceService);
  private versionDatasourceService = inject(VersionDatasourceService);
  private loadingService = inject(MeLoadingService);

  selectedDatasource: Datasource;

  selectedVersionDataSource: VersionDataSource;

  selectedAttributes: Array<QEAttribute> = [];

  renderSelectDataSourceComponent = false;

  renderQueryBuilderComponent = false;

  selectedSubQuery: SelectedSubQuery;

  private ready = new BehaviorSubject<boolean>(false);
  // eslint-disable-next-line
  ready$ = this.ready.asObservable();

  async ngOnInit(): Promise<void> {
    this._fetchEntitiesInSubQueries();
    this._registerEvents();
  }
  async onAddQueryClicked(subQuery: SelectedSubQuery): Promise<void> {
    this.selectedDataSources = [...(this.selectedDataSources || []), subQuery.dataSource];
    this.selectedDataSourcesChange.emit(this.selectedDataSources);
    this.subQueries = [...this.subQueries, subQuery];
    this.subQueriesChange.emit(this.subQueries);
    this.movedBackFromStepper();
  }

  moveTo(index: number): void {
    setTimeout(() => {
      if (this.stepper) {
        this.stepper.selectedIndex = index;
      }
    });
  }

  onUpdateQueryClicked(subQuery: SelectedSubQuery): void {
    const index = _findIndex(this.subQueries, {
      dataSourceId: subQuery.dataSourceId,
    });
    const mergedSubQuery = {
      ...subQuery,
    };
    //copy the existing columns
    mergedSubQuery.query.columns = this.subQueries[index]?.query?.columns || [];

    if (!_isEqual(mergedSubQuery, this.subQueries[index])) {
      this.subQueries.splice(index, 1, subQuery);
      this.subQueries = [...this.subQueries];

      this.subQueriesChange.emit(this.subQueries);
    }
    this.movedBackFromStepper();
  }

  onSelectedDatasource(value: DataSourceSelectionItem): void {
    this.selectedDatasource = value.dataSource;
    this.selectedAttributes = value.attributes;
    this.selectedVersionDataSource = value.version;
    this.moveToQueryBuilderStep();
  }

  movedBackFromStepper(): void {
    this.movedBackedFromStepper.emit();
  }

  onQueryBuilderBackClicked(): void {
    if (this.selectedSubQuery) {
      this.movedBackFromStepper();
    } else {
      this.moveToSelectDataSourceStep();
    }
  }

  moveToSelectDataSourceStep(): void {
    this.renderQueryBuilderComponent = false;
    this.moveTo(0);
  }

  moveToQueryBuilderStep(): void {
    this.renderQueryBuilderComponent = true;
    this.moveTo(1);
  }

  private async _getDataSourceById(id: string): Promise<Datasource> {
    const index = _findIndex(
      this.selectedDataSources || [],
      (datasource: Datasource) => datasource?.id === id,
    );
    if (index !== -1) {
      return Promise.resolve(this.selectedDataSources[index]);
    }
    return await firstValueFrom(this.datasourceService.getSingle(id));
  }

  private _getSubQueryAttribute(subQuery: SelectedSubQuery): Observable<Array<QEAttribute>> {
    if (!subQuery.dataSource) {
      subQuery.dataSource = _find(
        this.selectedDataSources,
        (dataSource: Datasource) => dataSource.id === subQuery.dataSourceId,
      );
    }
    this.loadingService.showLoader();
    return this.datasourceService.getAttributes(subQuery.dataSource, subQuery.version).pipe(
      map((attributes: Array<QEAttribute>) => {
        return _filter(attributes, (attr: QEAttribute) => attr.columnType !== 'unknown');
      }),
      finalize(() => this.loadingService.hideLoader()),
      untilDestroyed(this),
    );
  }

  private _registerEvents(): void {
    this.triggerEditSubQuery$
      .pipe(untilDestroyed(this))
      .subscribe(async (subQuery: SelectedSubQuery) => {
        this.renderSelectDataSourceComponent = false;
        await this._onEditSubQuery(subQuery);
        this.ready.next(true);
      });
    this.triggerFirstStep$.pipe(untilDestroyed(this)).subscribe(() => {
      this.renderSelectDataSourceComponent = true;
      this.ready.next(true);
    });
  }

  private _fetchEntitiesInSubQueries(): void {
    for (const query of this.subQueries) {
      const foundDataSource = _find(
        this.selectedDataSources || [],
        (dataSource: Datasource) => dataSource.id === query.dataSourceId,
      );
      query.dataSource = foundDataSource;
      if (!query.version && query.dataSourceVersionId) {
        query.version = this.versionDatasourceService.getVersionDataSourceById(
          query.dataSource,
          query.userFacingVersion,
        );
      }
    }
  }

  private async _onEditSubQuery(subQuery: SelectedSubQuery): Promise<void> {
    this.selectedSubQuery = subQuery;
    this.selectedDatasource = subQuery.dataSource
      ? subQuery.dataSource
      : await this._getDataSourceById(subQuery.dataSourceId);
    await this._retrieveVersionModels(subQuery);
    const attributes = await firstValueFrom(this._getSubQueryAttribute(subQuery));
    this.selectedAttributes = attributes;
    this.moveToQueryBuilderStep();
  }

  private async _retrieveVersionModels(subQuery: SelectedSubQuery): Promise<void> {
    if (subQuery.userFacingVersion) {
      this.selectedVersionDataSource = subQuery.version;
      if (!subQuery.version) {
        const dataSource =
          subQuery.dataSource || (await this._getDataSourceById(subQuery.dataSourceId));
        this.selectedVersionDataSource = subQuery.version
          ? subQuery.version
          : this.versionDatasourceService.getVersionDataSourceById(
              dataSource,
              subQuery.userFacingVersion,
            );
      }
    }
  }
}
