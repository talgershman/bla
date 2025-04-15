import {
  ChangeDetectorRef,
  EmbeddedViewRef,
  Injectable,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

@Injectable()
export class MePortalService {
  private targetRegistry: Map<string, ViewContainerRef> = new Map();

  registerViewContainer(id: string, viewContainerRef: ViewContainerRef): void {
    this.targetRegistry.set(id, viewContainerRef);
  }

  removeViewContainer(id: string): void {
    this.targetRegistry.delete(id);
  }

  attach(targetId: string, srcTemplate: TemplateRef<any>, cd: ChangeDetectorRef): void {
    const targetContainerRef = this.targetRegistry.get(targetId);
    const view = srcTemplate.createEmbeddedView(null);
    this._insertView(targetContainerRef, view, cd);
  }

  private _insertView(
    targetContainerRef: ViewContainerRef,
    view: EmbeddedViewRef<any>,
    cd: ChangeDetectorRef,
  ) {
    targetContainerRef?.clear();
    targetContainerRef?.insert(view);

    cd.detectChanges();
  }

  detach(targetId: string): void {
    const targetContainerRef = this.targetRegistry.get(targetId);

    targetContainerRef?.clear();
  }
}
