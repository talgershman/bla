import {ChangeDetectionStrategy, Component, HostBinding, Input} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import _upperFirst from 'lodash-es/upperFirst';

@Component({
  selector: 'me-error-feedback',
  templateUrl: './error-feedback.component.html',
  styleUrls: ['./error-feedback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MeSafePipe],
})
export class MeErrorFeedbackComponent {
  @HostBinding('style.--text-align')
  @Input()
  textAlign: string;

  _error: string;

  @Input('error')
  set setError(error: string) {
    this._error = error ? (_upperFirst(error) as unknown as string) : '';
  }
}
