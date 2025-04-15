import {ComponentRef, Type, ViewContainerRef} from '@angular/core';

import {MeTooltipViewRef} from './tooltip-entities';

interface Args<C> {
  component: Type<C>;
  viewContainerRef: ViewContainerRef;
}

export const isComponent = (value: any): value is Type<any> => typeof value === 'function';

export class MeTooltipCompRef<T> implements MeTooltipViewRef {
  private compRef: ComponentRef<T> | null;

  constructor(private args: Args<T>) {
    this.compRef = this.args.viewContainerRef.createComponent<T>(this.args.component);
  }

  detectChanges() {
    this.compRef?.changeDetectorRef.detectChanges();
    return this;
  }

  getElement<T extends Element>(): T {
    return this.compRef?.location.nativeElement;
  }

  destroy() {
    this.compRef?.destroy();
    this.compRef = null;
  }
}
