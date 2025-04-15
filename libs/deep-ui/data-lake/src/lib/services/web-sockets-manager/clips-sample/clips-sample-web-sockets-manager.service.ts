import {Injectable} from '@angular/core';
import {ApiErrorResponse} from 'deep-ui/shared/common';
import {ClipsSampleRequest} from 'deep-ui/shared/models';
import {WebSocketSubject} from 'rxjs/webSocket';

import {WebSocketsManagerService} from '../web-sockets-manager-service';

export interface SampleGFIMetadataGFI {
  clipName: string;
  gfi: number;
}

export type SampleGFIMetadataFrameId = Omit<SampleGFIMetadataGFI, 'gfi'> & {
  frame_id: number;
};

export type SampleGFIMetadata = SampleGFIMetadataGFI | SampleGFIMetadataFrameId;

export interface ClipsSampleMessage extends ApiErrorResponse {
  status: 200 | 500 | 400;
  content: {
    sample: SampleGFIMetadata[];
  };
}
@Injectable({
  providedIn: 'root',
})
export class ClipsSampleWebSocketsManagerService extends WebSocketsManagerService<
  ClipsSampleRequest,
  ClipsSampleMessage
> {
  protected baseUrl = this.urlBuilderService.clipsSampleBuilderApiBuilder('');

  checkResponseStatusIsOK(savedConnection: {
    connection: WebSocketSubject<any>;
    results: ClipsSampleMessage;
  }): boolean {
    return savedConnection?.results?.status === 200;
  }

  mapResponse(req: ClipsSampleRequest, res: ClipsSampleMessage): any {
    return res;
  }
}
