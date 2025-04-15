import {TemplateRef} from '@angular/core';
import {OptionsGeneric} from '@popperjs/core';

export interface MeTourStep {
  id?: string;
  headlineTitle?: string;
  stepMaxWidth?: 'medium' | 'large';
  title?: string;
  targetSelector?: string;
  template?: TemplateRef<any>;
  text?: string;
  innerHtml?: string;
  tooltipOptions?: Partial<OptionsGeneric<any>>;
  actions?: Array<MeTourAction>;
  isStartStep?: boolean;
  showPrevButton?: boolean;
}

export type MeTourStatus = 'completed' | 'discarded' | 'in_progress' | 'not_start' | 'failed';

export interface MeTourConfig {
  id: string;
  menuTitle: string;
  route: Array<string>;
  steps: Array<MeTourStep>;
  creationDate: string;
  watched?: boolean;
  isNew?: boolean;
  status?: MeTourStatus;
}

export type MeTourAction = MeTourActionSetText | MeTourActionPasteText | MeTourActionClickElement;

export interface MeTourActionSetText {
  type: 'type';
  inputSelector: string;
  text: string;
  waitFor?: number;
}

export interface MeTourActionPasteText {
  type: 'paste';
  inputSelector: string;
  text: string;
  waitFor?: number;
}

export interface MeTourActionClickElement {
  type: 'click-element';
  controlSelector: string;
  waitFor?: number;
}
