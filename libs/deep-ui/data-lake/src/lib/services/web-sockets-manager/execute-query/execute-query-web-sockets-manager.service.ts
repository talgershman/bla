import {Injectable} from '@angular/core';
import {ApiErrorResponse} from 'deep-ui/shared/common';
import {QueryObject, SubQuery} from 'deep-ui/shared/models';
import {WebSocketSubject} from 'rxjs/webSocket';

import {WebSocketsManagerService} from '../web-sockets-manager-service';

export interface ExecuteQueryMessage extends ApiErrorResponse {
  queryJson: Array<SubQuery>; // added in client side for better error msg
  status: 200 | 500 | 400;
  content: {
    pathOnS3: string;
    columns: Array<string>;
    statistics: {
      numberOfClips: number;
    };
    queryString: string;
    tableName: string;
    hasFrameIndicator: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ExecuteQueryWebSocketsManagerService extends WebSocketsManagerService<
  QueryObject,
  ExecuteQueryMessage
> {
  protected baseUrl = this.urlBuilderService.executeQueryBuilderApiBuilder('');

  checkResponseStatusIsOK(savedConnection: {
    connection: WebSocketSubject<any>;
    results: ExecuteQueryMessage;
  }): boolean {
    return savedConnection?.results?.status === 200;
  }

  mapResponse(req: QueryObject, res: ExecuteQueryMessage): any {
    return {
      ...res,
      queryJson: [...req.queries],
    };
  }
}
