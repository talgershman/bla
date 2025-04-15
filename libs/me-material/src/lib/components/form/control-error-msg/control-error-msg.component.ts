import {animate, style, transition, trigger} from '@angular/animations';
import {AsyncPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, Input, OnChanges} from '@angular/core';
import {ValidationErrors} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ERRORS_DICTIONARY} from '@mobileye/material/src/lib/common';
import {BehaviorSubject} from 'rxjs';
import {debounceTime, distinctUntilChanged, tap} from 'rxjs/operators';

@Component({
  selector: 'me-control-error-msg',
  templateUrl: './control-error-msg.component.html',
  styleUrls: ['./control-error-msg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('animation', [
      transition(':increment', [
        style({opacity: 0}),
        animate('200ms ease-in', style({opacity: 1})),
      ]),
      transition(':enter', [
        style({opacity: 0, transform: 'translateY(-0.5rem)'}),
        animate('200ms ease-in', style({opacity: 1, transform: 'translateY(0)'})),
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({opacity: 0, transform: 'translateY(-0.5rem)'})),
      ]),
    ]),
  ],
  imports: [AsyncPipe, MatFormFieldModule],
})
export class MeControlErrorMsgComponent implements OnChanges {
  @Input()
  errors: ValidationErrors;

  @Input()
  isTouched: boolean;

  private errorsDictionary = inject(ERRORS_DICTIONARY);

  increment = 0;

  textSubject = new BehaviorSubject<string>('');

  text$ = this.textSubject.asObservable().pipe(
    debounceTime(150),
    distinctUntilChanged(),
    tap(() => {
      this.increment += 1;
    }),
  );

  ngOnChanges(): void {
    const nextError = this.setNextError();
    this.setText(nextError);
  }

  private setText(value: string): void {
    this.textSubject.next(value);
  }

  private setNextError(): string {
    if (!this.errors || !this.isTouched) {
      return '';
    }
    const firstKey = Object.keys(this.errors)[0];
    const getError = this.errorsDictionary[firstKey];
    if (getError) {
      const error = getError(this.errors[firstKey]);
      if (typeof error === 'string') {
        return error as string;
      }
      return this.errors[firstKey];
    }
    return this.errors[firstKey];
  }
}
