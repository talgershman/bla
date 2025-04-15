import {InjectionToken, Renderer2, TemplateRef, Type} from '@angular/core';
import {Content, DefaultProps, Instance, Props} from 'tippy.js';

export type MeTippyProps = Partial<Props>;

export type MeTippyDefaultProps = Partial<DefaultProps>;

export interface MeTippyViewRef {
  getElement(): Content | null;
  detectChanges?(): void;
  destroy?(): void;
}

export interface MeTippyInstance extends Instance {
  tippyName: string;
  viewRef?: MeTippyViewRef;
}

export type MeTippyContent = MeTippyTemplate | null | undefined;

export type MeTippyTemplate = Content | TemplateRef<any> | Type<any>;

export type MeTippyContext = Record<string, any>;

export enum MeTippyNamesEnum {
  TippyName = 'tippyName',
}

export enum InstanceChangeReasonEnum {
  SetInstance = 'setInstance',
  Show = 'show',
  Hide = 'hide',
  HideWithInteractivity = 'hideWithInteractivity',
  Disable = 'disable',
  Enable = 'enable',
  SetProps = 'setProps',
  SetContent = 'setContent',
  Unmount = 'unmount',
  ClearDelayTimeouts = 'clearDelayTimeouts',
  Destroy = 'destroy',
}

export interface MeTippyHideAllOptions {
  duration?: number;
  excludeName?: string;
}

export type InstanceChangeReason = `${InstanceChangeReasonEnum}`;

export interface InstancesChanges {
  name: string;
  reason: InstanceChangeReason;
  instance: MeTippyInstance;
}

export interface MeTippyHTMLElement extends HTMLElement {
  _tippy: Instance;
}

export interface MeTooltipViewRef {
  getElement(): Content | null;
  detectChanges?(): void;
  destroy?(): void;
}

export const isHTMLTemplate = (value: any): value is HTMLTemplateElement =>
  value instanceof HTMLTemplateElement;

export const ME_TIPPY_CONFIG = new InjectionToken<MeTippyProps>('ME_TIPPY_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    delay: [300, 0],
    placement: 'bottom',
  }),
});

/**
 * Set display: "block" for content wrapper element
 *
 * @param tippyContent  { MeTippyContent }
 * @param renderer { Renderer2 }
 */
export const setTemplateVisible = (tippyContent: MeTippyContent, renderer: Renderer2) => {
  //eslint-disable-next-line
  tippyContent &&
    tippyContent instanceof Element &&
    renderer.setStyle(tippyContent, 'display', 'block');
};
