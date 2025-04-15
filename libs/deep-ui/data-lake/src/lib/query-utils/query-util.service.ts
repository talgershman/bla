import {Injectable} from '@angular/core';
import {SelectedSubQuery, SubQuery} from 'deep-ui/shared/models';

@Injectable({
  providedIn: 'root',
})
export class QueryUtilService {
  getSerializeQueries(selectedSubQueries: Array<SelectedSubQuery>): Array<SubQuery> {
    return selectedSubQueries.map((item: SelectedSubQuery) => {
      return {
        ...{
          query: item.query,
          dataSourceId: item.dataSourceId,
        },
        ...(item?.userFacingVersion && {userFacingVersion: item.userFacingVersion}),
        ...(item?.dataSourceVersionId && {dataSourceVersionId: item.dataSourceVersionId}),
      } as SubQuery;
    });
  }
}
