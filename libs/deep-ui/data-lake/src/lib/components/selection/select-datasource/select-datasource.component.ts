import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {DataSourceTablesComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/data-source-tables';
import {DatasourceService} from 'deep-ui/shared/core';
import {
  Datasource,
  DataSourceSelection,
  QEAttribute,
  VersionDataSource,
} from 'deep-ui/shared/models';
import _filter from 'lodash-es/filter';
import _intersection from 'lodash-es/intersection';
import _map from 'lodash-es/map';
import {finalize, map} from 'rxjs/operators';

export interface DataSourceSelectionItem {
  attributes: Array<QEAttribute>;
  dataSource: Datasource;
  version: VersionDataSource;
}

@Component({
  selector: 'de-select-datasource',
  templateUrl: './select-datasource.component.html',
  styleUrls: ['./select-datasource.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataSourceTablesComponent, MePortalSrcDirective, MatButtonModule],
})
export class SelectDatasourceComponent implements OnInit {
  @Input()
  selectedDataSources: Array<Datasource> = [];

  @Output()
  nextClicked = new EventEmitter<DataSourceSelectionItem>();

  @Output()
  backClicked = new EventEmitter<void>();

  protected datasourceService = inject(DatasourceService);
  private loadingService = inject(MeLoadingService);

  allowedSubTypesText: string;

  selected: Datasource;

  dataSourceSelection: DataSourceSelection;

  ngOnInit(): void {
    this._setAllowedSubTypesText();
  }

  onNextClicked(): void {
    this.loadingService.showLoader();
    this.datasourceService
      .getAttributes(this._getSelectedDataSource(), this.dataSourceSelection?.version)
      .pipe(
        map((attributes: Array<QEAttribute>) => {
          return _filter(attributes, (attr: QEAttribute) => attr.columnType !== 'unknown');
        }),
        finalize(() => this.loadingService.hideLoader()),
      )
      .subscribe((attributes: Array<QEAttribute>) => {
        this.nextClicked.emit({
          attributes,
          dataSource: this._getSelectedDataSource(),
          version: this.dataSourceSelection?.version,
        });
      });
  }

  private _setAllowedSubTypesText(): void {
    const allowedSubTypes = this._getAllowedSubTypes();
    this.allowedSubTypesText = allowedSubTypes.length
      ? `, allowed sub types: ${allowedSubTypes.join(', ').toUpperCase()}`
      : ':';
  }

  private _getAllowedSubTypes(): Array<string> {
    const allowedSubTypesArrays = _map(this.selectedDataSources, 'allowedSubTypes');
    return _intersection(...allowedSubTypesArrays);
  }

  private _getSelectedDataSource(): Datasource {
    return this.selected || this.dataSourceSelection?.dataSource;
  }
}
