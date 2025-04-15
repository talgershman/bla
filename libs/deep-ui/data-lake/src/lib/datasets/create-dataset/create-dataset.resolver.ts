import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {DatasourceService} from 'deep-ui/shared/core';
import {Dataset, Datasource, SubQuery} from 'deep-ui/shared/models';
import {forkJoin, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CreateDatasetResolver {
  private router = inject(Router);
  private datasourceService = inject(DatasourceService);

  //eslint-disable-next-line
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const dataset = this.router?.getCurrentNavigation()?.extras?.state?.dataset;
    const queryDashboard = this.router?.getCurrentNavigation()?.extras?.state?.queryDashboard;
    const selectedDataSources =
      this.router?.getCurrentNavigation()?.extras?.state?.selectedDataSources;
    if (queryDashboard && selectedDataSources?.length) {
      return of({
        dataset: {
          numberOfClips: queryDashboard.numberOfClips,
          queryJson: queryDashboard.queryJson,
          queryString: queryDashboard.queryString,
          pathOnS3: queryDashboard.pathOnS3,
        },
        selectedDataSources,
      });
    }
    if (dataset) {
      return this._getDataSources(dataset).pipe(
        map((datasources: Array<Datasource>) => {
          return {
            dataset,
            selectedDataSources: datasources,
          };
        }),
      );
    } else {
      return of({
        dataset: null,
        selectedDataSources: null,
      });
    }
  }

  private _getDataSources(dataset: Dataset): Observable<Array<Datasource>> {
    const requests = [];
    for (const query of dataset.queryJson as Array<SubQuery>) {
      const request = this.datasourceService.getSingle(query.dataSourceId);
      requests.push(request);
    }
    return forkJoin(requests);
  }
}
