import {inject, Injectable, Renderer2, RendererFactory2} from '@angular/core';
import {
  InstanceChangeReason,
  InstanceChangeReasonEnum,
  MeTippyContent,
  MeTippyContext,
  MeTippyDefaultProps,
  MeTippyHideAllOptions,
  MeTippyInstance,
  MeTippyProps,
  setTemplateVisible,
} from '@mobileye/material/src/lib/directives/tooltip/common';
import tippy, {hideAll} from 'tippy.js';

import {MeTooltipStorageService} from './tooltip-storage.service';
import {MeTooltipViewService} from './tooltip-view.service';

@Injectable()
export class MeTooltipService {
  private renderer!: Renderer2;

  private rendererFactory = inject(RendererFactory2);
  private tooltipStorageService = inject(MeTooltipStorageService);
  private tooltipViewService = inject(MeTooltipViewService);

  constructor() {
    this._createRenderer(this.rendererFactory);
  }
  /**
   * Working with tippy instance methods
   */

  /**
   * Programmatically show the tippy
   *
   * @param name { string } name of tippy instance
   */
  show(name: string) {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.Show);
  }

  /**
   * Programmatically hide the tippy
   *
   * @param name { string } name of tippy instance
   */
  hide(name: string) {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.Hide);
  }

  /**
   * Will hide the tippy only if the cursor is outside of the tippy's interactive region
   * This allows you to programmatically hook into interactive behavior upon a mouseleave event if implementing custom event listeners
   *
   * @param name { string } name of tippy instance
   * @param name { mouseEvent } pass the mouse event object in from your event listener
   */
  hideWithInteractivity(name: string, mouseEvent: MouseEvent) {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.HideWithInteractivity, mouseEvent);
  }

  /**
   * Prevent a tippy from showing or hiding
   *
   * @param name { string } name of tippy instance
   */
  disable(name: string) {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.Disable);
  }

  /**
   * Re-enable a tippy
   *
   * @param name { string } name of tippy instance
   */
  enable(name: string) {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.Enable);
  }

  /**
   * Update any tippy props
   *
   * @param name { string } name of tippy instance
   * @param tippyProps { MeTippyProps } new props
   */
  setProps(name: string, tippyProps: MeTippyProps) {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.SetProps, tippyProps);
  }

  /**
   * Update the content for tippy
   *
   * @param name { string } name of tippy instance
   * @param tippyContent { MeTippyContent } new content
   */
  setContent(name: string, tippyContent: MeTippyContent, tippyContext?: MeTippyContext) {
    const instance = this.tooltipStorageService.getInstance(name);

    if (!instance) {
      return;
    }

    if (tippyContent) {
      const viewRef = this.tooltipViewService.getViewRefInstance(
        tippyContent,
        instance.tippyName,
        tippyContext,
      );
      const content = viewRef.getElement();

      if (content) {
        setTemplateVisible(content, this.renderer);
        instance.setContent(content);
        instance.viewRef = viewRef;
        this._emitInstancesChange({
          name,
          reason: 'setContent',
          instance,
        });
      }
    }
  }

  /**
   * Unmount the tippy from the DOM
   *
   * @param name { string } name of tippy instance
   */
  unmount(name: string): void {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.Unmount);
  }

  /**
   * Clears the instances delay timeouts
   *
   * @param name { string } name of tippy instance
   */
  clearDelayTimeouts(name: string): void {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.ClearDelayTimeouts);
  }

  /**
   * Permanently destroy and clean up the tippy instance
   *
   * @param name { string } name of tippy instance
   */
  destroy(name: string): void {
    this._callNativeTippyMethod(name, InstanceChangeReasonEnum.Destroy);
    this.tooltipStorageService.tippyInstances.delete(name);
  }

  /** Working with tippy static methods */

  /**
   * Set the default props for each new tippy instance
   *
   * @param tippyProps {  MeTippyDefaultProps } default props
   */
  setDefaultProps(tippyProps: MeTippyDefaultProps) {
    tippy.setDefaultProps(tippyProps);
  }

  /**
   * Show all tippies
   */
  showAll() {
    this.tooltipStorageService.tippyInstances.forEach((instance: MeTippyInstance, name: string) => {
      instance.show();
      this._emitInstancesChange({
        name,
        reason: 'show',
        instance,
      });
    });
  }

  /**
   * Hide all tippies or hide all except a particular one
   * Additional hide them with duration
   *
   * @param { MeTippyHideAllOptions } [options] - additional hiding options
   */
  hideAll(options?: MeTippyHideAllOptions) {
    const exclude = this.tooltipStorageService.getInstance(options?.excludeName || '');
    const duration = options?.duration;

    hideAll({duration, ...exclude});
  }

  private _createRenderer(rendererFactory: RendererFactory2): void {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  private _callNativeTippyMethod(name: string, method: any, arg?: any): void {
    const instance = this.tooltipStorageService.getInstance(name);

    if (instance) {
      instance[method as Exclude<InstanceChangeReason, 'setInstance'>](arg);

      this._emitInstancesChange({
        name,
        reason: method,
        instance,
      });
    }
  }

  private _emitInstancesChange({
    name,
    reason,
    instance,
  }: {
    reason: InstanceChangeReason;
    name: string;
    instance: MeTippyInstance;
  }): void {
    this.tooltipStorageService.emitInstancesChange({name, reason, instance});
  }
}
