import {Directive, inject, Input, OnDestroy, OnInit, ViewContainerRef} from '@angular/core';
import {MePortalService} from '@mobileye/material/src/lib/services/portal';

@Directive({
  selector: '[mePortalTarget]',
})
export class MePortalTargetDirective implements OnInit, OnDestroy {
  @Input('mePortalTarget') id: string;

  private portalService = inject(MePortalService);
  private view = inject(ViewContainerRef);

  ngOnInit(): void {
    this.portalService.registerViewContainer(this.id, this.view);
  }

  ngOnDestroy(): void {
    this.portalService.removeViewContainer(this.id);
  }
}
