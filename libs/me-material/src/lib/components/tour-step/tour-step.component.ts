import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MeTourStep} from '@mobileye/material/src/lib/common';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {Observable} from 'rxjs';

@Directive({
  selector: '[meCustomTourStep]',
})
export class CustomTourStepDirective {
  @Input() tourId: string;
  @Input() stepId: string;

  templateRef = inject<TemplateRef<any>>(TemplateRef);
}

@Component({
  selector: 'me-tour-step',
  styleUrls: ['./tour-step.component.scss'],
  templateUrl: './tour-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, MatButtonModule, AsyncPipe, MeSafePipe],
})
export class MeTourStepComponent {
  @ViewChild('dynamicContainer', {read: ViewContainerRef}) dynamicContainer: ViewContainerRef;

  @Input()
  step: MeTourStep;

  @Input()
  isButtonsEnabled$: Observable<boolean>;

  @Input()
  showPrevButton: boolean;

  @Input()
  isFixedPosition: boolean;

  @Input()
  headlineTitle: string;

  @Input()
  currentStepIndex: number;

  @Input()
  totalSteps: number;

  @Input()
  shouldRender: boolean;

  @Input()
  isStartStep: boolean;

  @HostBinding('style.--max-width')
  @Input()
  maxWidth: string;

  @Output()
  nextClicked = new EventEmitter<void>();

  @Output()
  prevClicked = new EventEmitter<void>();

  @Output()
  closeClicked = new EventEmitter<void>();
}
