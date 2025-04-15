import {Directive, inject, Input, OnChanges} from '@angular/core';
import {NgControl} from '@angular/forms';

@Directive({
  selector: '[meDisableControl]',
})
export class MeDisableControlDirective implements OnChanges {
  @Input()
  disableControl: boolean;

  private ngControl = inject(NgControl);

  ngOnChanges(changes): void {
    if (changes.disableControl && typeof this.disableControl !== 'undefined') {
      const action = this.disableControl ? 'disable' : 'enable';

      this.ngControl.control[action]();
    }
  }
}
