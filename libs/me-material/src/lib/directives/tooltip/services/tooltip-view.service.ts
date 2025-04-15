import {
  ApplicationRef,
  inject,
  Injectable,
  TemplateRef,
  Type,
  ViewContainerRef,
} from '@angular/core';
import {
  isComponent,
  isHTMLTemplate,
  isTemplateRef,
  MeTippyContext,
  MeTippyTemplate,
  MeTooltipCompRef,
  MeTooltipTemplateRef,
  MeTooltipViewRef,
} from '@mobileye/material/src/lib/directives/tooltip/common';

@Injectable()
export class MeTooltipViewService {
  viewContainerRef!: ViewContainerRef;

  private appRef = inject(ApplicationRef);

  getViewRefInstance(
    content: MeTippyTemplate,
    tippyName?: string,
    tippyContext: MeTippyContext = {},
  ): MeTooltipViewRef {
    let viewRef!: MeTooltipViewRef;

    if (isTemplateRef(content)) {
      tippyContext.$implicit = tippyName;
      viewRef = this._createTemplate(content, tippyContext);
    } else if (isComponent(content)) {
      viewRef = this._createComponent(content);
    } else if (isHTMLTemplate(content)) {
      viewRef = {
        getElement: () => content.content,
      };
    } else {
      viewRef = {
        getElement: () => content,
      };
    }

    return viewRef;
  }

  private _createTemplate<C>(tpl: TemplateRef<any>, context: C) {
    return new MeTooltipTemplateRef<C>({
      tpl,
      context,
      appRef: this.appRef,
    });
  }

  private _createComponent<C>(component: Type<C>) {
    return new MeTooltipCompRef<C>({
      component,
      viewContainerRef: this.viewContainerRef,
    });
  }
}
