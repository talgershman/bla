import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {DatasetService, DatasourceService} from 'deep-ui/shared/core';
import {Dataset, Datasource, SubQuery} from 'deep-ui/shared/models';
import {forkJoin, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EditDatasetResolver {
  private datasetService = inject(DatasetService);
  private datasourceService = inject(DatasourceService);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const id = route.paramMap.get('id');
    return this._getDataset(id).pipe(
      switchMap((dataset: Dataset) => {
        return this._getDataSources(dataset).pipe(
          map((datasources: Array<Datasource>) => {
            return {
              dataset,
              selectedDataSources: datasources,
            };
          }),
        );
      }),
    );
  }

  private _getDataset(id: string): Observable<Dataset> {
    return this.datasetService.getSingle(id, {});
  }

  private _getDataSources(dataset: Dataset): Observable<Array<Datasource>> {
    const requests = [];
    for (let query of dataset.queryJson as Array<SubQuery>) {
      const request = this.datasourceService.getSingle(query.dataSourceId);
      requests.push(request);
    }
    return forkJoin(requests);
  }
}
