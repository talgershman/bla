import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {parseInteger} from '@mobileye/material/src/lib/utils';
import {ClipListService} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';
import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EditClipListResolver {
  private clipListService = inject(ClipListService);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const id = route.paramMap.get('id');
    const idNum = parseInteger(id);
    return this.clipListService.getSingle(idNum, {}).pipe(
      map((response: ClipList) => response),
      first(),
    );
  }
  /* eslint-enable */
}
