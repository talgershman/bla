import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {parseInteger} from '@mobileye/material/src/lib/utils';
import {EtlService, ParsingConfigurationService} from 'deep-ui/shared/core';
import {ETL} from 'deep-ui/shared/models';
import {combineLatest, Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ViewEtlResolver {
  private etlService = inject(EtlService);
  private parsingConfigurationService = inject(ParsingConfigurationService);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const id = route.paramMap.get('id');
    const idNum = parseInteger(id);
    return combineLatest([
      this.etlService.getServiceNames(),
      this.etlService.getSingle(idNum, {}).pipe(map((response: ETL) => response)),
      this.parsingConfigurationService.getLeanMulti(),
    ]).pipe(
      map(([serviceNames, etl, parsingConfigs]) => {
        return {
          serviceNames,
          etl,
          parsingConfigs,
        };
      }),
      first(),
    );
  }
}
