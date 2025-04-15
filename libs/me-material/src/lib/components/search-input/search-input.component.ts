import {NgStyle} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnInit,
  viewChild,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'me-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatIconButton,
    NgStyle,
  ],
})
export class MeSearchInput implements OnInit {
  controller = input<FormControl<string>>(null);

  placeholder = input<string>('');

  dummyContent = viewChild('dummyContent', {read: ElementRef});

  readonly MIN_WIDTH = 360;

  inputWidth = `${this.MIN_WIDTH}px`;

  ngOnInit(): void {
    this.controller()
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((value) => {
        //because input doesn't grow when text is added, we copy the text to a span and update the input width to match the span
        const spanElem = this.dummyContent().nativeElement;
        spanElem.innerHTML = value.replace(/\s/g, '&nbsp;');
        this.inputWidth = `${spanElem.offsetWidth}px`;
      });
  }
}
