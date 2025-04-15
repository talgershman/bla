import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {FormControlStatus, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {distinctUntilChanged, startWith} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-cloud-mco-cmd-step',
  templateUrl: './cloud-mco-cmd-step.component.html',
  styleUrls: ['./cloud-mco-cmd-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeTextareaComponent, ReactiveFormsModule],
})
export class CloudMcoCmdStepComponent extends BaseStepDirective {
  isCompareVersionsFlow = input<boolean>(false);
  isCompareVersionsFlow$ = toObservable(this.isCompareVersionsFlow);

  form = new FormGroup({
    mainCmd: this.jobFormBuilderService.createNewFormControl<string>(
      '',
      'metadata.cloud_mco.source_command',
      null,
      {validators: [Validators.required]},
    ),
    dependentCmd: this.jobFormBuilderService.createNewFormControl<string>('', '', null, {
      validators: [],
    }),
  });

  ngOnInit(): void {
    super.ngOnInit();
    this._registerEvents();
  }

  private _registerEvents(): void {
    this.form.statusChanges
      .pipe(
        startWith<FormControlStatus>(this.form.status),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((value: FormControlStatus) => this.formState.emit(value));

    this.isCompareVersionsFlow$
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((isCompareVersionFlow: boolean) => {
        this.form.controls.dependentCmd.setValidators(
          isCompareVersionFlow ? [Validators.required] : null,
        );
      });
  }
}
