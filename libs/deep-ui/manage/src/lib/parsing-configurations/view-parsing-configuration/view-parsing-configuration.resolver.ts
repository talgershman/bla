import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {parseInteger} from '@mobileye/material/src/lib/utils';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {ParsingConfiguration} from 'deep-ui/shared/models';
import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ViewParsingConfigurationResolver {
  private parsingConfigurationService = inject(ParsingConfigurationService);
  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const id = route.paramMap.get('id');
    const idNum = parseInteger(id);
    return this.parsingConfigurationService.getSingle(idNum, {}).pipe(
      map((response: ParsingConfiguration) => response),
      first(),
    );
  }
  /* eslint-enable */
}
