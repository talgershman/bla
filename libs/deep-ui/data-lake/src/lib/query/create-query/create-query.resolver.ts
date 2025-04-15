import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {DatasourceService} from 'deep-ui/shared/core';
import {Datasource, SubQuery} from 'deep-ui/shared/models';
import {forkJoin, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CreateQueryResolver {
  private router = inject(Router);
  private datasourceService = inject(DatasourceService);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const onLoadGoToEditQueryIndex =
      this.router.getCurrentNavigation()?.extras?.state?.onLoadGoToEditQueryIndex;
    const subQueries = this.router.getCurrentNavigation()?.extras?.state?.subQueries;

    if (onLoadGoToEditQueryIndex !== null && onLoadGoToEditQueryIndex !== undefined) {
      return this._getDataSources(subQueries).pipe(
        map((datasources: Array<Datasource>) => {
          return {
            onLoadGoToEditQueryIndex,
            subQueries: subQueries,
            selectedDataSources: datasources,
          };
        }),
      );
    } else {
      return of({
        onLoadGoToEditQueryIndex: null,
        subQueries: [],
        selectedDataSources: [],
      });
    }
  }

  private _getDataSources(subQueries: Array<SubQuery>): Observable<Array<Datasource>> {
    const requests = [];
    for (let query of subQueries) {
      const request = this.datasourceService.getSingle(query.dataSourceId);
      requests.push(request);
    }
    return forkJoin(requests);
  }
  /* eslint-enable */
}
