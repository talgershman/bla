export enum ColorPaletteIndexEnum {
  ColorPaletteIndexBlack = 'black',
  ColorPaletteIndexGreen = 'green',
  ColorPaletteIndexBlue = 'blue',
  ColorPaletteIndexRed = 'red',
}

export class MeJsonTopLvlObject {
  uiConfigs?: MeJsonMessageUiConfigs;
  [key: string]: any;
}

export class MeJsonMessageUiConfigs {
  expandAll: boolean;
  keys?: {
    [key: string]: {
      uiKeyConfigs: MeJsonMessageUiKeyConfigs;
      uiValueConfigs: Omit<MeJsonMessageUiValueConfigs, 'value'>;
    };
  };

  constructor() {
    this.expandAll = true;
  }
}
export class MeJsonMessageUiValueConfigs {
  value: number | string | boolean;
  color?: ColorPaletteIndexEnum;
  bold?: boolean;
  html?: string;
  tooltip?: string;
  linkTitle?: string;

  constructor() {
    this.color = ColorPaletteIndexEnum.ColorPaletteIndexBlack;
    this.bold = false;
    this.html = '';
    this.tooltip = '';
    this.linkTitle = '';
  }
}

export class MeJsonMessageUiKeyConfigs {
  title?: string;
  expanded?: boolean;
  tooltip?: string;
  color?: ColorPaletteIndexEnum;
  bold?: boolean;
  order?: number;

  constructor() {
    this.title = '';
    this.expanded = false;
    this.tooltip = '';
    this.color = ColorPaletteIndexEnum.ColorPaletteIndexBlack;
    this.bold = false;
    this.order = 0;
  }
}

export const SNAKE_CASE_KEYS_TO_CONVERT = ['ui_key_configs', 'ui_value_configs'];
