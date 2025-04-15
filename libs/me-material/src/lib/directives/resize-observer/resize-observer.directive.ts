import {Directive, ElementRef, inject, input, OnDestroy, OnInit} from '@angular/core';
import {debounce} from 'lodash-decorators/debounce';
import {Subject} from 'rxjs';

@Directive({
  selector: '[meResizeObserver]',
})
export class MeResizeObserver implements OnInit, OnDestroy {
  meResizeDisabled = input<any>(undefined);

  protected el = inject(ElementRef);
  meResizeChange = new Subject<ResizeObserverEntry>();
  destroyed = false;

  private static resizeEntriesMap = new WeakMap<HTMLElement, MeResizeObserver>();
  private static changes: ResizeObserver;

  ngOnInit(): void {
    if (this.meResizeDisabled()) {
      return;
    }
    const element = this.el.nativeElement;
    MeResizeObserver.resizeEntriesMap.set(element, this);
    MeResizeObserver.changes =
      MeResizeObserver.changes ||
      new ResizeObserver((resizeEntries: Array<ResizeObserverEntry>) => {
        for (const entry of resizeEntries) {
          const target = entry.target as HTMLElement;
          if (MeResizeObserver.resizeEntriesMap.has(target)) {
            const selectedComp: MeResizeObserver = MeResizeObserver.resizeEntriesMap.get(target);
            selectedComp._emitResize(entry);
          }
        }
      });
    MeResizeObserver.changes.observe(element);
  }

  ngOnDestroy(): void {
    if (!this.meResizeDisabled()) {
      MeResizeObserver.changes.unobserve(this.el.nativeElement);
      MeResizeObserver.resizeEntriesMap.delete(this.el.nativeElement);
    }
    this.destroyed = true;
  }

  @debounce(100)
  private _emitResize(entry: ResizeObserverEntry): void {
    if (this.destroyed) {
      return;
    }
    this.meResizeChange.next(entry);
  }
}
