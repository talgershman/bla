import {CdkAccordionItem, CdkAccordionModule} from '@angular/cdk/accordion';
import {NgClass, NgStyle} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {
  MeJsonMessageUiConfigs,
  MeJsonMessageUiKeyConfigs,
  MeJsonMessageUiValueConfigs,
} from '@mobileye/material/src/lib/components/json-message/common';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {parseInteger} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import _sortBy from 'lodash-es/sortBy';
import {OnChange} from 'property-watch-decorator';

import {MeJsonMessageService} from '../json-message.service';
import {MeLineMessageComponent} from '../line-message/line-message.component';

export interface DisplayValueObj {
  itemDisplayType: 'value';
  key: string;
  type: string;
  value: any;
  configs: MeJsonMessageUiKeyConfigs;
  valueConfigs: MeJsonMessageUiValueConfigs;
}

export interface DisplayGroupObj {
  itemDisplayType: 'group';
  key: string;
  type: string;
  value: any;
  configs: MeJsonMessageUiKeyConfigs;
}

@UntilDestroy()
@Component({
  selector: 'me-group-message',
  templateUrl: './group-message.component.html',
  styleUrls: ['./group-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeLineMessageComponent,
    CdkAccordionModule,
    NgStyle,
    MeTooltipDirective,
    NgClass,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    HintIconComponent,
  ],
})
export class MeGroupMessageComponent implements OnInit {
  @Input()
  uiConfigs: MeJsonMessageUiConfigs | undefined;

  @OnChange<void>('_onMsgChanged')
  @Input()
  msg: MeJsonMessageUiKeyConfigs;

  @Input()
  level: number;

  @Input()
  valueType: string;

  @Input()
  parentType: string;

  @Input()
  parentKey: string;

  displayMsg: any;

  items: Array<DisplayGroupObj | DisplayValueObj>;

  private jsonMessageService = inject(MeJsonMessageService);
  private cd = inject(ChangeDetectorRef);

  ngOnInit() {
    this._registerEvents();
    this.displayMsg = this.msg;
    this.items = this._generateItems();
  }

  private _onMsgChanged() {}

  private _generateItems(): Array<DisplayGroupObj | DisplayValueObj> {
    const {nestedObjects, regularKeys} = this._getObjectsAndKeys(this.msg);
    const mergedArrays = [...nestedObjects, ...regularKeys];
    return _sortBy(mergedArrays, [
      'configs.order',
      (obj: DisplayGroupObj) => {
        const num = parseInteger(obj?.key);
        if (Number.isNaN(num)) {
          return obj?.key?.toLowerCase();
        }
        return num;
      },
    ]) as Array<DisplayGroupObj>;
  }

  private _getObjectsAndKeys(currentObj: any): {
    nestedObjects: Array<DisplayGroupObj>;
    regularKeys: Array<DisplayValueObj>;
  } {
    const nestedObjectsWithKeys: Array<DisplayGroupObj> = [];
    const regularKeys: Array<DisplayValueObj> = [];

    for (const key in currentObj) {
      const currentValue = currentObj[key];
      const keyConfigs = this.jsonMessageService.getKeyConfigValue(this.uiConfigs, key);
      const valueConfigs = this.jsonMessageService.getValueConfigValue(
        this.displayMsg,
        this.uiConfigs,
        this.parentKey,
        this.parentType,
        key,
        currentValue,
      );
      const value = valueConfigs.value;
      const type = this.jsonMessageService.typeOfValue(value);
      if (typeof value === 'object' && currentObj[key] !== null) {
        nestedObjectsWithKeys.push({
          itemDisplayType: 'group',
          configs: keyConfigs,
          key,
          type,
          value,
        });
      } else {
        regularKeys.push({
          itemDisplayType: 'value',
          configs: keyConfigs,
          valueConfigs: valueConfigs,
          value,
          key,
          type,
        });
      }
    }

    return {
      nestedObjects: nestedObjectsWithKeys,
      regularKeys: regularKeys,
    };
  }

  private _registerEvents(): void {
    this.jsonMessageService
      .getCollapseAllObs()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        for (const item of this.items) {
          if (item.itemDisplayType === 'group') {
            item.configs.expanded = false;
          }
        }
        this.cd.detectChanges();
      });
    this.jsonMessageService
      .getExpandAllObs()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        for (const item of this.items) {
          if (item.itemDisplayType === 'group') {
            item.configs.expanded = true;
          }
        }
        this.cd.detectChanges();
      });
  }

  onToggleGroupClicked(accordionItem: CdkAccordionItem, item: DisplayGroupObj): void {
    accordionItem.toggle();
    item.configs.expanded = accordionItem.expanded;
  }
}
