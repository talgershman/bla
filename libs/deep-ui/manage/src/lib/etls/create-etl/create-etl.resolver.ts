import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {EtlService, ParsingConfigurationService} from 'deep-ui/shared/core';
import {ParsingConfiguration} from 'deep-ui/shared/models';
import {combineLatest, Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CreateEtlResolver {
  private etlService = inject(EtlService);
  private parsingConfigurationService = inject(ParsingConfigurationService);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return combineLatest([
      this.etlService.getServiceNames(),
      this.parsingConfigurationService
        .getLeanMulti()
        .pipe(map((response: Array<ParsingConfiguration>) => response)),
    ]).pipe(
      map(([serviceNames, parsingConfigs]) => {
        return {
          serviceNames,
          parsingConfigs,
        };
      }),
      first(),
    );
  }
}
