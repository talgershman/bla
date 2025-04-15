import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  input,
  OnInit,
  Output,
  Signal,
  signal,
} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxChange, MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {VersionDatasourceService} from 'deep-ui/shared/core';
import {Datasource, QEAttribute, SelectedSubQuery, VersionDataSource} from 'deep-ui/shared/models';

import {GroupComponent} from './group/group.component';
import {RuleService} from './rule/rule.service';

@Component({
  selector: 'de-query-builder',
  templateUrl: './query-builder.component.html',
  styleUrls: ['./query-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    HintIconComponent,
    MatCheckboxModule,
    GroupComponent,
  ],
  providers: [RuleService],
})
export class QueryBuilderComponent implements OnInit {
  dataSource = input<Datasource>();

  versionDataSource = input<VersionDataSource>();

  @Input()
  isReadOnlyMode: boolean;

  @Input()
  attributes: Array<QEAttribute>;

  @Input()
  subQuery: SelectedSubQuery;

  @Input()
  allowAggregation: boolean;

  @Input()
  forceShowConditions: boolean;

  @Output()
  backClicked = new EventEmitter<void>();

  @Output()
  addQueryClicked = new EventEmitter<SelectedSubQuery>();

  @Output()
  updateQueryClicked = new EventEmitter<SelectedSubQuery>();

  private versionDatasourceService = inject(VersionDatasourceService);

  isDataSourceLatestVersion = computed(() => {
    return (
      !this.versionDataSource() ||
      this.versionDataSource().userFacingVersion === this.dataSource().latestUserVersion
    );
  });

  conditionsForm = new FormGroup<any>({});

  aggregationForm = new FormGroup<any>({});

  useLatestVersion = signal(false);

  enableLatestVersion: boolean;

  showEmptyMessage = signal(false);

  versionText: Signal<string> = computed(() => {
    let versionText = '';
    if (!this.dataSource().versioned) {
      versionText = '';
    } else {
      if (this.useLatestVersion() && this.isDataSourceLatestVersion()) {
        versionText = 'Latest';
      } else {
        const version = this.versionDatasourceService.getVersionDataSource(
          this.dataSource(),
          this.versionDataSource(),
        );
        versionText = version.userFacingVersion;
      }
    }
    return versionText;
  });

  ngOnInit(): void {
    this.enableLatestVersion = this._enableLatestVersion();
    const isEmpty = this._isEmptyQuery();
    this.showEmptyMessage.set(isEmpty);
    this._setLatestVersion();
  }

  onAddQueryClicked(): void {
    this.conditionsForm.markAllAsTouched();
    if (this.conditionsForm.valid) {
      const conditionsObj = this.conditionsForm.getRawValue();
      const conditionsNextValue = !conditionsObj?.rules?.length ? {} : conditionsObj;
      const aggregationObj = this.aggregationForm.getRawValue();
      const isLatest = this._isLatest();
      const version: VersionDataSource = this.versionDatasourceService.getVersionDataSource(
        this.dataSource(),
        this.versionDataSource(),
      );
      const updatedValue: Partial<SelectedSubQuery> = {
        ...{
          query: {
            columns: [],
            conditions: conditionsNextValue,
            materialized: false,
          },
          dataSourceId: this.dataSource().id,
          dataSource: this.dataSource(),
        },
        ...(!isLatest && {
          dataSourceVersionId: version?.id,
          userFacingVersion: version?.userFacingVersion,
          version,
        }),
      };

      if (aggregationObj.aggregateKey) {
        updatedValue.query.aggregation = aggregationObj;
      }
      if (!this.subQuery) {
        this.addQueryClicked.emit(updatedValue as SelectedSubQuery);
      } else {
        this.updateQueryClicked.emit(updatedValue as SelectedSubQuery);
      }
    }
  }

  onUseLatestVersionChanged(event: MatCheckboxChange): void {
    this.useLatestVersion.set(event.checked);
  }

  onAddConditionsClicked(): void {
    this.resetQueryConditions();
    this.showEmptyMessage.set(false);
  }
  onClearConditions(): void {
    this.showEmptyMessage.set(true);
  }

  private resetQueryConditions(): void {
    if (this.subQuery?.query?.conditions) {
      this.subQuery.query.conditions = {
        condition: 'AND',
        rules: [],
      };
    }
  }

  private _isEmptyQuery(): boolean {
    return !this.subQuery?.query?.conditions?.rules?.length;
  }

  private _setLatestVersion(): void {
    if (this.subQuery) {
      this.useLatestVersion.set(!this.subQuery.userFacingVersion);
    } else {
      this.useLatestVersion.set(
        !(this.isDataSourceLatestVersion() && this.dataSource().status === 'updating'),
      );
    }
  }

  private _enableLatestVersion(): boolean {
    return (
      this.dataSource().versioned &&
      (!this.versionDataSource() ||
        this.versionDataSource().userFacingVersion === this.dataSource().latestUserVersion)
    );
  }

  private _isLatest(): boolean {
    return this.versionText() === 'Latest';
  }
}
