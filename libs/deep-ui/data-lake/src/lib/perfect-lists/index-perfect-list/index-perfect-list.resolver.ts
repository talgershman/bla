import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {AssetManagerService} from 'deep-ui/shared/core';
import {Observable, of} from 'rxjs';
import {first, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IndexPerfectListResolver {
  private assetManagerService = inject(AssetManagerService);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return this.assetManagerService.getTechnologiesOptions().pipe(
      switchMap((technologiesOptions: MeSelectOption[]) => {
        return of({
          technologiesOptions,
        });
      }),
      first(),
    );
  }
  /* eslint-enable */
}
