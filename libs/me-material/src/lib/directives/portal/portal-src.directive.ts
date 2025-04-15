import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  inject,
  Input,
  OnDestroy,
  TemplateRef,
} from '@angular/core';
import {MePortalService} from '@mobileye/material/src/lib/services/portal';

@Directive({
  selector: '[mePortalSrc]',
})
export class MePortalSrcDirective implements AfterViewInit, OnDestroy {
  @Input('mePortalSrc') targetId: string;

  private cd = inject(ChangeDetectorRef);
  private portalService = inject(MePortalService);
  private templateRef = inject(TemplateRef<any>);

  ngAfterViewInit(): void {
    this.portalService.attach(this.targetId, this.templateRef, this.cd);
  }

  ngOnDestroy(): void {
    this.portalService.detach(this.targetId);
  }
}
