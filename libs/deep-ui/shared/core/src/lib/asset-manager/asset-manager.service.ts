import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import _sortBy from 'lodash-es/sortBy';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

import {UrlBuilderService} from '../url-builder/url-builder.service';

@Injectable({
  providedIn: 'root',
})
export class AssetManagerService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  public technologiesOptions: MeSelectOption[] = [];

  getTechnologiesOptions(): Observable<MeSelectOption[]> {
    if (!this.technologiesOptions.length) {
      const url = this.urlBuilder.assetsManagerServiceApiBuilder('technologies/');
      return this.httpClient.get<string[]>(url).pipe(
        map((response: string[]) => {
          const technologies: MeSelectOption[] = [];
          for (const tech of response) {
            technologies.push({
              id: tech,
              value: tech,
            });
          }
          this.technologiesOptions = _sortBy(technologies, 'value');
          return technologies;
        }),
      );
    }
    return of(this.technologiesOptions);
  }

  getTechnologies(): Observable<Array<string>> {
    const url = this.urlBuilder.assetsManagerServiceApiBuilder('technologies/');
    return this.httpClient.get<Array<string>>(url);
  }
}
