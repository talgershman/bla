import {Injectable} from '@angular/core';
import {environment} from 'deep-ui/shared/environments';
import {ParsedQuery, stringifyUrl} from 'query-string';
import urlJoin from 'url-join';

@Injectable({
  providedIn: 'root',
})
export class UrlBuilderService {
  join(...args: (string | ParsedQuery<any>)[]): any {
    let queryParams = {};
    const newArgs = args.filter(Boolean);
    if (newArgs && typeof newArgs[newArgs.length - 1] === 'object') {
      queryParams = newArgs.pop();
    }
    return stringifyUrl({
      url: urlJoin(...(newArgs as any)),
      query: queryParams,
    });
  }

  stateReflectorApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.stateReflectorApi}${path}`, ...args);
  }

  validationJobsBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.stateReflectorApi}${path}`, ...args);
  }

  qlikApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.onPremProxyApi}${path}`, ...args);
  }

  launchServiceApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.launchServiceApi}${path}`, ...args);
  }

  assetsManagerServiceApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.assetsManagerApi}${path}`, ...args);
  }

  iShowApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.onPremProxyApi}${path}`, ...args);
  }

  onPremApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.onPremProxyApi}${path}`, ...args);
  }

  probeBuilderApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.probeBuilderApi}${path}`, ...args);
  }

  dataLoaderApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.dataLoaderApi}${path}`, ...args);
  }

  datasetBuilderApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.datasetsServiceApi}${path}`, ...args);
  }

  datasetBuilderV2ApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.datasetsServiceV2Api}${path}`, ...args);
  }

  queryEngineApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.queryEngineServiceApi}${path}`, ...args);
  }

  executeQueryBuilderApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.executeQueryApi}${path}`, ...args);
  }

  clipsSampleBuilderApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.clipsSampleApi}${path}`, ...args);
  }

  imageServiceBuilderApiBuilder(path: string, ...args: (string | ParsedQuery<any>)[]): string {
    return this.join(`${environment.imageServiceApi}${path}`, ...args);
  }
}
