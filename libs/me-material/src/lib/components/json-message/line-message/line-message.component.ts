import {NgClass, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {
  ColorPaletteIndexEnum,
  MeJsonMessageUiKeyConfigs,
  MeJsonMessageUiValueConfigs,
} from '@mobileye/material/src/lib/components/json-message/common';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import copy from 'copy-to-clipboard';
import {NgxMaskPipe} from 'ngx-mask';

import {MeJsonMessageService} from '../json-message.service';

@Component({
  selector: 'me-line-message',
  templateUrl: './line-message.component.html',
  styleUrls: ['./line-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeTooltipDirective,
    NgxMaskPipe,
    NgClass,
    MatFormFieldModule,
    MatMenuModule,
    NgTemplateOutlet,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MeSafePipe,
    HintIconComponent,
  ],
})
export class MeLineMessageComponent implements OnInit, OnDestroy {
  @Input()
  key: string;

  @Input()
  value: any;

  @Input()
  valueType: string;

  @Input()
  parentType: string;

  @Input()
  parentKey: string;

  @Input()
  keyConfigs: MeJsonMessageUiKeyConfigs;

  @Input()
  valueConfigs: MeJsonMessageUiValueConfigs;

  valueTextColorClass: string;

  keyTextColorClass: string;

  keyDisplay: string;

  isButtonsShown: boolean;

  hoverTimeout: any;

  currentValueType: string;

  private jsonMessageService = inject(MeJsonMessageService);
  private cd = inject(ChangeDetectorRef);
  private snackbar = inject(MeSnackbarService);

  ngOnInit(): void {
    this.currentValueType = this._getCurrentValueType();
    this._setTextColor();
    this._setKeyDisplay();
  }

  ngOnDestroy(): void {
    clearTimeout(this.hoverTimeout);
  }

  showButtons(): void {
    this.hoverTimeout = setTimeout(() => {
      this.isButtonsShown = true;
      this.cd.detectChanges();
    }, 250);
  }

  hideButtons(): void {
    clearTimeout(this.hoverTimeout);
    this.isButtonsShown = false;
  }

  copyToClipboard(value: string): void {
    copy(value);
    this.snackbar.onCopyToClipboard();
  }

  private _getCurrentValueType(): string {
    if (this.valueConfigs?.html) {
      return 'html';
    } else if (this.valueConfigs?.linkTitle) {
      return 'link';
    } else {
      return this.valueType;
    }
  }

  private _setTextColor(): void {
    this.keyTextColorClass = `${this.keyConfigs?.color}-text`;
    this.valueTextColorClass = `${this.valueConfigs?.color}-text`;
    const redWords = this.jsonMessageService.getKnownRedKeys();
    if (redWords.includes(this.key) || redWords.includes(this.parentKey)) {
      this.keyTextColorClass = `${ColorPaletteIndexEnum.ColorPaletteIndexRed}-text`;
      this.valueTextColorClass = `${ColorPaletteIndexEnum.ColorPaletteIndexRed}-text`;
    }
  }

  private _setKeyDisplay(): void {
    this.keyDisplay = this.jsonMessageService.convertToWords(this.key);
  }
}
