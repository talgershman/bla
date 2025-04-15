import {Injectable} from '@angular/core';
import {
  ColorPaletteIndexEnum,
  MeJsonMessageUiConfigs,
  MeJsonMessageUiKeyConfigs,
  MeJsonMessageUiValueConfigs,
} from '@mobileye/material/src/lib/components/json-message/common';
import {Observable, Subject} from 'rxjs';

@Injectable()
export class MeJsonMessageService {
  private readonly defaultGlobalConfigs: MeJsonMessageUiConfigs = {
    expandAll: true,
  };

  private readonly defaultValueConfigs: Omit<MeJsonMessageUiValueConfigs, 'value'> = {
    tooltip: '',
    bold: false,
    html: '',
    linkTitle: '',
  };

  private readonly defaultKeyConfigs: MeJsonMessageUiKeyConfigs = {
    tooltip: '',
    bold: false,
    order: 9999,
  };

  private readonly KNOWN_RED_KEYS = ['error', 'stderr', 'stacktrace'];

  private expandAllSubject = new Subject<void>();
  private collapseAllSubject = new Subject<void>();

  getKnownRedKeys(): Array<string> {
    return this.KNOWN_RED_KEYS;
  }

  getExpandAllObs(): Observable<void> {
    return this.expandAllSubject.asObservable();
  }

  getCollapseAllObs(): Observable<void> {
    return this.collapseAllSubject.asObservable();
  }
  expandAll(): void {
    this.expandAllSubject.next();
  }

  collapseAll(): void {
    this.collapseAllSubject.next();
  }

  convertToWords(input: string): string {
    if (!input) {
      return input;
    }
    // Capitalize first letter of each word and convert the rest to lowercase
    let formattedText = input.replace(/\w\S*/g, function (txt) {
      return txt ? txt.charAt(0).toUpperCase() + txt.substring(1) : '';
    });

    // Replace underscores with spaces
    formattedText = formattedText.replace(/_/g, ' ');

    return formattedText;
  }

  getValueConfigValue(
    displayMsg: any,
    uiConfigs: MeJsonMessageUiConfigs,
    parentKey: string,
    parentType: string,
    key: string,
    currentValue: any,
  ): MeJsonMessageUiValueConfigs {
    const currentKey = parentType === 'array' ? parentKey : key;
    const defaultConfig = this._generateDefaultValueConfig(currentValue);
    const config: MeJsonMessageUiValueConfigs = {
      ...defaultConfig,
      ...this._getGlobalValueConfigByKey(uiConfigs, currentKey),
      value: currentValue,
    };
    config.value = this._handleStringArray(displayMsg, config.value, key) ?? config.value;
    return config;
  }

  getKeyConfigValue(uiConfigs: MeJsonMessageUiConfigs, key: string): MeJsonMessageUiKeyConfigs {
    const defaultConfig = this._generateDefaultKeyConfig(uiConfigs, key);
    const config: MeJsonMessageUiKeyConfigs = {
      ...defaultConfig,
      ...this._getGlobalKeyConfigByKey(uiConfigs, key),
    };
    return config;
  }

  typeOfValue(currentValue): string {
    if (Array.isArray(currentValue)) {
      return 'array';
    }
    if (currentValue === null) {
      return 'null';
    }
    return typeof currentValue;
  }

  convertObjectToCamelCase(obj: any, attributesToConvert: Array<string>): any {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const camelObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (attributesToConvert.includes(key)) {
            const camelKey = key.replace(/_([a-z])/g, function (match, p1) {
              return p1.toUpperCase();
            });
            camelObj[camelKey] = this.convertObjectToCamelCase(obj[key], attributesToConvert);
          } else {
            camelObj[key] = this.convertObjectToCamelCase(obj[key], attributesToConvert);
          }
        }
      }
      return camelObj;
    } else if (Array.isArray(obj)) {
      return obj.map((item) => this.convertObjectToCamelCase(item, attributesToConvert));
    } else {
      return obj;
    }
  }

  convertSettingsToCamelCase(ui_configs: any): any {
    if (!ui_configs) {
      return ui_configs;
    }
    const uiConfigs = {};
    for (const key in ui_configs) {
      const newKey = key.replace(/_([a-z])/g, function (match, p1) {
        return p1.toUpperCase();
      });
      uiConfigs[newKey] = ui_configs[key];
    }
    return uiConfigs;
  }

  private _generateDefaultValueConfig(currentValue: any): MeJsonMessageUiValueConfigs {
    const type = this.typeOfValue(currentValue);
    const color = this._getDefaultColorByType(type);
    return {
      ...this.defaultValueConfigs,
      value: currentValue,
      color,
    };
  }

  private _generateDefaultKeyConfig(
    uiConfigs: MeJsonMessageUiConfigs,
    key: string,
  ): MeJsonMessageUiKeyConfigs {
    const title = this.convertToWords(key);
    const expanded = this._getGlobalConfigSettings(uiConfigs)?.expandAll ?? true;
    const redKeys = this.getKnownRedKeys();
    return {
      ...this.defaultKeyConfigs,
      color: redKeys.includes(key)
        ? ColorPaletteIndexEnum.ColorPaletteIndexRed
        : ColorPaletteIndexEnum.ColorPaletteIndexBlack,
      title,
      expanded,
    };
  }

  private _getGlobalConfigSettings(
    uiConfigs: MeJsonMessageUiConfigs,
  ): Omit<MeJsonMessageUiConfigs, 'keys'> {
    if (!uiConfigs) {
      return this.defaultGlobalConfigs;
    }
    const settings = {
      ...this.defaultGlobalConfigs,
      ...uiConfigs,
    };
    delete settings.keys;
    return settings;
  }

  private _getGlobalValueConfigByKey(
    uiConfigs: MeJsonMessageUiConfigs,
    key: string,
  ): Omit<MeJsonMessageUiValueConfigs, 'value'> {
    return uiConfigs?.keys?.[key]?.uiValueConfigs || {};
  }

  private _getGlobalKeyConfigByKey(
    uiConfigs: MeJsonMessageUiConfigs,
    key: string,
  ): MeJsonMessageUiKeyConfigs {
    return uiConfigs?.keys?.[key]?.uiKeyConfigs || {};
  }

  private _handleStringArray(displayMsg: any, currentValue: any, key: string): any {
    if (typeof currentValue === 'string' && currentValue?.trimEnd().includes('\n')) {
      const value = this._convertToArray(currentValue);
      //override the value to array
      displayMsg[key] = value;
      return value;
    }
    return currentValue;
  }

  private _convertToArray(strValue: string): Array<string> {
    return strValue
      .split('\n')
      .map((value) => value.trimEnd())
      .filter((value) => !!value);
  }

  private _getDefaultColorByType(valueType: string): ColorPaletteIndexEnum {
    switch (valueType) {
      case 'string':
        return ColorPaletteIndexEnum.ColorPaletteIndexGreen;
      case 'number':
        return ColorPaletteIndexEnum.ColorPaletteIndexBlue;
      default:
        return ColorPaletteIndexEnum.ColorPaletteIndexBlack;
    }
  }
}
