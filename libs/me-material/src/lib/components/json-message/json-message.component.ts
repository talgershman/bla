import {ChangeDetectionStrategy, Component, inject, Input, OnInit, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {
  MeJsonMessageUiConfigs,
  MeJsonTopLvlObject,
  SNAKE_CASE_KEYS_TO_CONVERT,
} from '@mobileye/material/src/lib/components/json-message/common';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {prettyPrintJson} from '@mobileye/material/src/lib/utils';
import copy from 'copy-to-clipboard';
import _cloneDeep from 'lodash-es/cloneDeep';
import {OnChange} from 'property-watch-decorator';

import {MeGroupMessageComponent} from './group-message/group-message.component';
import {MeJsonMessageService} from './json-message.service';

@Component({
  selector: 'me-json-message',
  templateUrl: './json-message.component.html',
  styleUrls: ['./json-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeGroupMessageComponent, MatIconModule, MatButtonModule],
  providers: [MeJsonMessageService],
})
export class MeJsonMessageComponent implements OnInit {
  @OnChange<void>('_onMsgChanged')
  @Input()
  msg: MeJsonTopLvlObject;

  @Input()
  hideParentKey: boolean;

  showButtons: boolean;

  uiConfigs: MeJsonMessageUiConfigs;

  copyMsg: any;

  show = signal<boolean>(false);

  jsonMessageService = inject(MeJsonMessageService);
  private snackbar = inject(MeSnackbarService);
  private initTrigger = false;

  ngOnInit(): void {
    this.initTrigger = true;
    this._onMsgChanged();
  }

  copyToClipboard(): void {
    const prettyJson = prettyPrintJson(this.msg, true);
    copy(prettyJson);
    this.snackbar.onCopyToClipboard();
  }

  private _handleHideParentKey(): void {
    if (!this.hideParentKey) {
      return;
    }
    const keys = Object.keys(this.copyMsg || {}).length;
    if (keys === 1) {
      for (const key in this.copyMsg || {}) {
        if (typeof this.copyMsg[key] === 'object') {
          this.copyMsg = this.copyMsg[key];
          if (this._isEmptyObject(this.copyMsg)) {
            this.copyMsg = null;
          }
        }
      }
    }
  }

  private _onMsgChanged(): void {
    this.show.set(false);
    if (!this.initTrigger) {
      return;
    }
    this.copyMsg = _cloneDeep(this.msg);
    this.copyMsg = this.jsonMessageService.convertObjectToCamelCase(
      this.copyMsg,
      SNAKE_CASE_KEYS_TO_CONVERT,
    );
    if (this.copyMsg?.ui_configs) {
      this.uiConfigs = this.jsonMessageService.convertSettingsToCamelCase(this.copyMsg?.ui_configs);
    } else {
      this.uiConfigs = {
        ...this.copyMsg?.uiConfigs,
      };
    }
    delete this.copyMsg?.uiConfigs;
    delete this.copyMsg?.ui_configs;
    this._handleHideParentKey();

    requestAnimationFrame(() => {
      this.show.set(true);
    });
  }

  private _isEmptyObject(obj: any): boolean {
    return Object.keys(obj || {}).length === 0;
  }
}
