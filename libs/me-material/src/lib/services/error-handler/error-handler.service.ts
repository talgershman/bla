import {inject, Injectable, NgZone} from '@angular/core';
import {ToastrService} from 'ngx-toastr';

export enum MeErrorType {
  Default,
  VPN,
  OnPremCertificate,
  AWS,
}

export interface MeErrorObject {
  errorType?: MeErrorType;
  title?: string;
  titleInnerHtml?: string;
  bodyText?: string;
  innerHtml?: string;
  request?: string;
  response?: any;
  status?: number;
  message?: string;
  json?: any;
  stackTrance?: any;
}

@Injectable()
export class MeErrorHandlerService {
  private toastService = inject(ToastrService);
  private ngZone = inject(NgZone);

  raiseError(data: MeErrorObject): void {
    const mergedData = {errorType: MeErrorType.Default, ...data};
    const dataStr = JSON.stringify(mergedData);
    this.ngZone.run(() => this.toastService.error(dataStr));
  }
}
