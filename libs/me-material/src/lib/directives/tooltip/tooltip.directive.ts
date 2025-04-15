import {
  AfterViewInit,
  Directive,
  effect,
  ElementRef,
  inject,
  Input,
  input,
  model,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {MeResizeObserver} from '@mobileye/material/src/lib/directives/resize-observer';
import {
  ME_TIPPY_CONFIG,
  MeTippyContent,
  MeTippyContext,
  MeTippyHTMLElement,
  MeTippyInstance,
  MeTippyProps,
  MeTooltipViewRef,
  setTemplateVisible,
} from '@mobileye/material/src/lib/directives/tooltip/common';
import {
  MeTooltipService,
  MeTooltipStorageService,
  MeTooltipViewService,
} from '@mobileye/material/src/lib/directives/tooltip/services';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {filter} from 'rxjs';
import tippy, {Instance, Placement, Props} from 'tippy.js';

@UntilDestroy()
@Directive({
  selector: '[meTooltip]',
  providers: [MeTooltipService, MeTooltipViewService],
})
export class MeTooltipDirective
  extends MeResizeObserver
  implements OnInit, AfterViewInit, OnDestroy
{
  tippyContent = input<MeTippyContent>(undefined, {alias: 'meTooltip'});
  tippyProps = input<MeTippyProps>({}, {alias: 'meTooltipProps'});
  tippyName = model<string>(undefined, {alias: 'meTooltipName'});
  tippyClassName = input<string>(undefined, {alias: 'meTooltipClass'});
  meTooltipContext = input<MeTippyContext>();
  disabled = input<boolean>(undefined, {alias: 'meTooltipDisabled'});
  meResizeDisabled = input<any>(true);
  @Input('meTooltipPosition') placement?: Placement;
  @Input('meTooltipOnEllipsis') ellipsis?: boolean;
  @Input('meTooltipEllipsisHost') htmlElementEllipsisHost?: HTMLElement;
  @Input() meTooltipResizeTrigger: (entry: ResizeObserverEntry) => void = (
    entry: ResizeObserverEntry,
  ) => {
    const target = entry.target as HTMLElement;
    const {offsetWidth, scrollWidth} = target;
    target['meElementTooltipDisabled'] = offsetWidth >= scrollWidth;
  };

  private tippyConfig = inject<MeTippyProps>(ME_TIPPY_CONFIG);
  protected el: ElementRef = inject(ElementRef);

  private tippyContent$ = toObservable(this.tippyContent);
  private tippyContext$ = toObservable(this.meTooltipContext);
  private prevTippyName: string;
  private prevClassName: string;
  private mouseEnterRemoveListener: () => void;
  private mouseLeaveRemoveListener: () => void;
  private tippyInstance: MeTippyInstance | undefined;
  private cachedInstances = new Map();
  private mouseEntered = false;
  private isHover = false;
  private isInitialized = false;
  private readonly ELLIPSIS_TIMEOUT = 300;

  private tippyEl = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tooltipService = inject(MeTooltipService);
  private tooltipViewService = inject(MeTooltipViewService);
  private tooltipStorageService = inject(MeTooltipStorageService);
  private viewContainerRef = inject(ViewContainerRef);
  private ngZone = inject(NgZone);

  constructor() {
    super();
    effect(() => {
      if (this.isInitialized) {
        this._handleNameChanges(this.tippyName());
      }
    });
    effect(() => {
      if (this.isInitialized) {
        this._handlePropsChanges(this.tippyProps());
      }
    });
    effect(() => {
      if (this.isInitialized) {
        this._handleClassChanges(this.tippyClassName());
      }
    });
    effect(() => {
      if (this.isInitialized) {
        this._handleDisabledChanges(this.disabled());
      }
    });
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.tippyContent$
      .pipe(untilDestroyed(this))
      .subscribe(
        (content: MeTippyContent) => this.isInitialized && this._handleContentChanges(content),
      );
    this.tippyContext$
      .pipe(
        filter((ctx: MeTippyContext) => !!ctx),
        untilDestroyed(this),
      )
      .subscribe(
        (context: MeTippyContext) => this.isInitialized && this._handleContextChanges(context),
      );
    this.meResizeChange
      .pipe(untilDestroyed(this))
      .subscribe((entry: ResizeObserverEntry) => this.meTooltipResizeTrigger(entry));
    this.tooltipViewService.viewContainerRef = this.viewContainerRef;
    this.isInitialized = true;
  }
  ngAfterViewInit(): void {
    this.mouseEnterRemoveListener = this.renderer.listen(this.el.nativeElement, 'mouseenter', () =>
      this.onMouseEnter(),
    );
    this.mouseLeaveRemoveListener = this.renderer.listen(this.el.nativeElement, 'mouseleave', () =>
      this.onMouseLeave(),
    );
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._destroyTippy();
    this.tooltipViewService.viewContainerRef = null;
    if (this.mouseEnterRemoveListener) {
      this.mouseEnterRemoveListener();
    }
    if (this.mouseLeaveRemoveListener) {
      this.mouseLeaveRemoveListener();
    }
  }

  onMouseEnter(): void {
    this.mouseEntered = true;
    if (this.ellipsis && !this._isEllipsis()) {
      return;
    }

    if (!this.tippyInstance) {
      this._initTippy();
    }

    if (!this.tippyInstance) {
      return;
    }

    this._runOutsideAngular(this.tippyInstance.disable);
    if (!this.disabled() && ((this.ellipsis && this._isEllipsis()) || !this.ellipsis)) {
      this.tooltipService.setProps(this.tippyInstance.tippyName, {
        ...(this.tippyInstance.props || {}),
        interactive: true,
        appendTo: document.body,
        onShow: (_: Instance<Props>): void => {
          this.isHover = true;
        },
        onHidden: (_: Instance<Props>): void => {
          if (this.isHover && this.tippyInstance) {
            requestAnimationFrame(() => {
              this._destroyTippy();
            });
          }
          this.isHover = false;
        },
      });
      this._runOutsideAngular(this.tippyInstance.enable);
      setTimeout(() => {
        if (this.mouseEntered && this.tippyInstance?.show) {
          this._runOutsideAngular(this.tippyInstance.show);
        }
      }, this.ELLIPSIS_TIMEOUT);
    }
  }

  onMouseLeave(): void {
    this.mouseEntered = false;
  }

  show(): void {
    if (!this.tippyInstance) {
      this._initTippy();
    }
    if (this.tippyInstance) {
      this._runOutsideAngular(this.tippyInstance.show);
    }
  }

  hide(): void {
    if (this.tippyInstance?.hide) {
      this._runOutsideAngular(this.tippyInstance.hide);
    }
  }

  /**
   * Tooltip initialize
   * Content can be directly passed through `tippyContent` selector
   */
  private _initTippy(): void {
    const tippyTarget: MeTippyHTMLElement = this.tippyEl.nativeElement;
    if (
      this.tippyContent() === null ||
      this.tippyContent() === undefined ||
      this.tippyContent() === ''
    )
      return;

    const viewRef = this.tooltipViewService.getViewRefInstance(
      this.tippyContent(),
      this.tippyName(),
      this.meTooltipContext(),
    );
    const tippyElement = viewRef.getElement();

    let tInstance;

    this._runOutsideAngular(() => {
      tInstance = tippy(tippyTarget, {
        ...this.tippyConfig,
        ...(this.placement && {placement: this.placement}),
        ...(this.tippyProps() || {}),
        ...(tippyElement && {content: tippyElement}),
      });
    });
    this.tippyName.set(this.tippyName() || `tippy-${tInstance.id}`);

    setTemplateVisible(tippyElement, this.renderer);
    this._setTippyInstance({tippyTarget, tippyName: this.tippyName(), viewRef});
    this._setDisabled(this.tippyInstance, this.disabled());
    this._setClassName(this.tippyInstance, this.tippyClassName());
    this._writeInstancesToStorage(this.tippyInstance, this.tippyName());
  }

  private _destroyTippy(): void {
    const tippyInstances = this._cachedTippyInstances();
    const tippyInstance = this.tippyInstance;

    if (!tippyInstance || !tippyInstances) return;

    this._clearInstance({tippyInstance, tippyInstances});
    this._resetLocalInstance();
  }

  private _setTippyInstance({
    tippyTarget,
    tippyName,
    viewRef,
  }: {
    tippyTarget: MeTippyHTMLElement;
    tippyName: string;
    viewRef: MeTooltipViewRef;
  }): void {
    this.tippyInstance = {...tippyTarget._tippy, tippyName, viewRef};
  }

  private _setClassName(
    tippyInstance: MeTippyInstance | undefined,
    className: string | undefined,
  ): void {
    if (!className || !tippyInstance) return;
    const classNames = className.split(' ');

    //eslint-disable-next-line
    classNames.length &&
      classNames.forEach((className) =>
        this.renderer.addClass(tippyInstance.popper.firstElementChild, className),
      );
    this.prevClassName = className;
  }

  /**
   * To manipulate tooltips, write all instances to storage
   * `tippyName` used as unique key
   * If `tippyName` does not provided - it will be generated using `tippyInstance.id`
   *
   * @param tippyInstance { MeTippyInstance }
   */
  private _writeInstancesToStorage(
    tippyInstance: MeTippyInstance | undefined,
    tippyName: string,
  ): void {
    //eslint-disable-next-line
    tippyInstance && this.tooltipStorageService.setInstance(tippyName, tippyInstance);
  }

  private _handleNameChanges(currentValue: string): void {
    const tippyInstances = this._cachedTippyInstances();
    if (!tippyInstances || !this.tippyInstance) return;

    this._deleteEntryInStorage(tippyInstances, this.prevTippyName);
    this.tippyInstance = {...this.tippyInstance, tippyName: currentValue};
    tippyInstances.set(currentValue, this.tippyInstance);
    this.prevTippyName = currentValue;
  }

  private _handleContentChanges(currentValue: MeTippyContent): void {
    if (this.tippyInstance && this.tippyName) {
      this.tooltipService.setContent(this.tippyName(), currentValue);

      if (currentValue === null || currentValue === undefined) {
        this.tooltipService.disable(this.tippyName());
      } else {
        this.tooltipService.enable(this.tippyName());
      }
    }
  }

  private _handlePropsChanges(currentValue: MeTippyProps): void {
    //eslint-disable-next-line
    this.tippyName && this.tooltipService.setProps(this.tippyName(), currentValue);
  }

  private _handleClassChanges(currentValue: string): void {
    this._removeClassName(this.tippyInstance, this.prevClassName);
    this._setClassName(this.tippyInstance, currentValue);
  }

  private _handleContextChanges(currentValue: MeTippyContext): void {
    if (this.tippyInstance && this.tippyName() && this.meTooltipContext()) {
      this.tooltipService.setContent(this.tippyName(), this.tippyContent(), currentValue);
    }
  }

  private _cachedTippyInstances(): Map<string, MeTippyInstance> | null {
    const tippyInstances = this.tooltipStorageService.getInstances();

    if (this.cachedInstances.has(tippyInstances)) {
      return this.cachedInstances.get(tippyInstances);
    } else {
      this.cachedInstances.set(tippyInstances, tippyInstances);
      return tippyInstances;
    }
  }

  private _deleteEntryInStorage(
    tippyInstances: Map<string, MeTippyInstance>,
    tippyName: string,
  ): void {
    tippyInstances.delete(tippyName);
  }

  private _removeClassName(
    tippyInstance: MeTippyInstance | undefined,
    className: string | undefined,
  ): void {
    if (!className || !tippyInstance) return;
    const classNames = className.split(' ');

    //eslint-disable-next-line
    classNames.length &&
      classNames.forEach((className) => {
        this.renderer.removeClass(tippyInstance.popper.firstElementChild, className);
      });
  }

  private _clearInstance({
    tippyInstance,
    tippyInstances,
  }: {
    tippyInstance: MeTippyInstance;
    tippyInstances: Map<string, MeTippyInstance>;
  }): void {
    const {tippyName} = tippyInstance;
    this._clearViewRef(tippyInstance);
    this._destroyTippyInstance(tippyInstance);
    this._deleteEntryFromStorage(tippyInstances, tippyName);
  }

  private _clearViewRef(tippyInstance: MeTippyInstance): void {
    //eslint-disable-next-line
    tippyInstance.viewRef?.destroy && tippyInstance.viewRef.destroy();
  }

  private _destroyTippyInstance(tippyInstance: MeTippyInstance): void {
    tippyInstance.destroy();
    this.tippyInstance = null;
  }

  private _deleteEntryFromStorage(
    tippyInstances: Map<string, MeTippyInstance>,
    tippyName: string,
  ): void {
    tippyInstances.delete(tippyName);
  }

  private _resetLocalInstance(): void {
    this.tippyInstance = undefined;
  }

  private _clearCachedInstances(): void {
    this.cachedInstances.clear();
  }

  private _setDisabled(
    tippyInstance: MeTippyInstance | undefined,
    disabled: boolean | undefined,
  ): void {
    if (!tippyInstance || disabled === undefined) return;
    if (disabled) {
      this._runOutsideAngular(tippyInstance.disable);
    } else {
      this._runOutsideAngular(tippyInstance.enable);
    }
  }

  private _handleDisabledChanges(currentValue: boolean): void {
    this._setDisabled(this.tippyInstance, currentValue);
  }

  private _isEllipsis(): boolean {
    if (this.htmlElementEllipsisHost) {
      return this.htmlElementEllipsisHost.offsetWidth < this.htmlElementEllipsisHost.scrollWidth;
    }
    return this.tippyEl.nativeElement.offsetWidth < this.tippyEl.nativeElement.scrollWidth;
  }

  private _runOutsideAngular(fn: (...args: any[]) => any): void {
    this.ngZone.runOutsideAngular(fn);
  }
}
