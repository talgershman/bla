import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {Router} from '@angular/router';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {Datasource, SelectedSubQuery, SubQuery} from 'deep-ui/shared/models';

import {QueryDashboardControlComponent} from '../../../components/controls/query-dashboard-control/query-dashboard-control.component';
import {QueryEngineService} from '../../../services/query-engine/query-engine.service';

@Component({
  selector: 'de-standalone-query',
  templateUrl: './standalone-query.component.html',
  styleUrls: ['./standalone-query.component.scss'],
  imports: [QueryDashboardControlComponent, ReactiveFormsModule, MatButtonModule],
})
export class StandaloneQueryComponent {
  @Input()
  subQueries: Array<SelectedSubQuery> = [];

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
  editSubQuery = new EventEmitter<SubQuery>();

  queryDashboardControl = new FormControl<any>(null);

  private router = inject(Router);
  private queryEngineService = inject(QueryEngineService);
  private snackbarService = inject(MeSnackbarService);

  exportToDatasetClicked(): void {
    if (this._isValid()) {
      this._redirectToDataset();
    }
  }

  async exportToClipListClicked(): Promise<void> {
    if (this._isValid()) {
      await this._redirectToClipList();
    }
  }

  private _isValid(): boolean {
    this.queryDashboardControl.updateValueAndValidity();
    this.queryDashboardControl.markAsTouched();
    return this.queryDashboardControl.valid;
  }

  private _redirectToDataset(): void {
    this.router.navigate(['data-lake', 'datasets', 'create'], {
      state: {
        queryDashboard: this.queryDashboardControl.getRawValue(),
        selectedDataSources: [...this.selectedDataSources],
      },
    });
  }

  private async _redirectToClipList(): Promise<void> {
    const tableName = this.queryDashboardControl.value.tableName;
    this.snackbarService.open('Redirecting to create clip list... please wait');

    const file = await this.queryEngineService.downloadClipList(true, tableName);
    this.router.navigate(['manage', 'clip-lists', 'create'], {
      state: {
        file,
      },
    });
  }
}
