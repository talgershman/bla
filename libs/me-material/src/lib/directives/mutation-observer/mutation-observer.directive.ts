import {Directive, ElementRef, inject, input, OnDestroy, OnInit, output} from '@angular/core';
import {debounce} from 'lodash-decorators/debounce';

@Directive({
  selector: '[meMutationObserver]',
})
export class MeMutationObserver implements OnInit, OnDestroy {
  meObserveAttributes = input<boolean>(true);
  meObserveChildList = input<boolean>(false);
  meObserveSubTree = input<boolean>(false);
  meObserveAttributeNames = input<Array<string>>([]);
  meDomChanges = output<Array<MutationRecord>>();

  private el = inject(ElementRef);

  private changes: MutationObserver;

  ngOnInit(): void {
    const element = this.el.nativeElement;

    this.changes = new MutationObserver((mutations: MutationRecord[]) => {
      this._emitMutation(mutations);
    });
    this.changes.observe(element, this._getConfig());
  }

  ngOnDestroy(): void {
    this.changes.disconnect();
  }

  private _getConfig(): Record<string, any> {
    const config: Record<string, any> = {};
    if (this.meObserveAttributes()) {
      config.attributes = true;
    }
    if (this.meObserveChildList()) {
      config.childList = true;
    }
    if (this.meObserveSubTree()) {
      config.subtree = true;
    }
    if (this.meObserveAttributeNames().length > 0) {
      config.attributeFilter = this.meObserveAttributeNames();
    }
    return config;
  }

  @debounce(100)
  private _emitMutation(mutations: Array<MutationRecord>): void {
    this.meDomChanges.emit(mutations);
  }
}
