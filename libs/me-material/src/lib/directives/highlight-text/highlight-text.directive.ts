import {Directive, ElementRef, inject, Input, OnChanges, Renderer2} from '@angular/core';
import {debounce} from 'lodash-decorators/debounce';

@Directive({
  selector: '[meHighlightText]',
})
export class MeHighlightTextDirective implements OnChanges {
  @Input()
  search: string;

  @Input()
  text: string;

  @Input()
  classToApply: string;

  @Input()
  highlight = true;

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnChanges(): void {
    this._setText();
  }

  @debounce(50)
  private _setText() {
    if (!this.search || !this.classToApply) {
      this.renderer.setProperty(this.el.nativeElement, 'innerHTML', this.text);
      return;
    }
    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', this.getFormattedText());
  }

  escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getFormattedText(): string {
    if (this.highlight) {
      const escapeStr = this.escapeRegExp(this.search);
      const regEx = new RegExp(escapeStr, 'ig');
      return this.text.replace(regEx, `<span class="${this.classToApply}">$&</span>`);
    }
    return this.text;
  }
}
