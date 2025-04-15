import {RippleGlobalOptions} from '@angular/material/core';
import {MatTooltipDefaultOptions} from '@angular/material/tooltip';

export const globalRippleConfig: RippleGlobalOptions = {disabled: false};

//this settings will allow the tooltip to hide when mouseleave
export const globalTooltipConfig: MatTooltipDefaultOptions = {
  showDelay: 0,
  hideDelay: 0,
  touchendHideDelay: 1500,
  disableTooltipInteractivity: true,
};
