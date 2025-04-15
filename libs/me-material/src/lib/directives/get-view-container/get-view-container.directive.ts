import {Directive, inject, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[templateContainer]',
})
export class TemplateContainerDirective {
  viewContainerRef = inject(ViewContainerRef);
}
