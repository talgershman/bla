import {ApplicationRef, EmbeddedViewRef, TemplateRef} from '@angular/core';

import {MeTooltipViewRef} from './tooltip-entities';

interface CustomTemplateRefArgs<C> {
  tpl: TemplateRef<C>;
  context: C;
  appRef: ApplicationRef;
}

export const isTemplateRef = (value: any): value is TemplateRef<any> =>
  value instanceof TemplateRef;

export class MeTooltipTemplateRef<C> implements MeTooltipViewRef {
  private viewRef: EmbeddedViewRef<C> | null;
  private element!: Element | null;

  constructor(private args: CustomTemplateRefArgs<C>) {
    this.viewRef = this.args.tpl.createEmbeddedView(this.args.context || ({} as C));
    this.viewRef.detectChanges();
    this.args.appRef.attachView(this.viewRef);
  }

  detectChanges() {
    this.viewRef?.detectChanges();
    return this;
  }

  getElement(): Element | null {
    if (!this.viewRef) return null;

    const rootNodes = this.viewRef.rootNodes;

    if (rootNodes.length === 1 && rootNodes[0].nodeType === Node.ELEMENT_NODE) {
      this.element = rootNodes[0];
    } else {
      this.element = document.createElement('div');
      this.element.append(...rootNodes);
    }

    return this.element;
  }

  destroy() {
    if (!this.viewRef) return;

    if (this.viewRef.rootNodes[0] !== 1) {
      this.element?.parentNode?.removeChild(this.element);
      this.element = null;
    }

    this.viewRef.destroy();
    this.viewRef = null;
  }
}
