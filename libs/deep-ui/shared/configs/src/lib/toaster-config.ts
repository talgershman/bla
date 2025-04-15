// eslint-disable-next-line
import {GlobalConfig} from 'ngx-toastr/toastr/toastr-config';
import {MeToastComponent} from '@mobileye/material/src/lib/components/toast';

export const toasterConfig: Partial<GlobalConfig> = {
  maxOpened: 3,
  timeOut: 60000,
  autoDismiss: true,
  extendedTimeOut: 0,
  closeButton: true,
  newestOnTop: true,
  tapToDismiss: false,
  easeTime: 100,
  toastComponent: MeToastComponent,
  positionClass: 'toast-top-right',
};
