import {ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormControl, FormControlStatus, FormGroup, Validators} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SelectParsingListComponent} from 'deep-ui/shared/components/src/lib/selection/select-parsing-list';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {ParsingConfiguration} from 'deep-ui/shared/models';
import {distinctUntilChanged, startWith} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-parsing-step',
  templateUrl: './parsing-step.component.html',
  styleUrls: ['./parsing-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectParsingListComponent],
})
export class ParsingStepComponent extends BaseStepDirective implements OnInit {
  @Output()
  parsingChanged = new EventEmitter<ParsingConfiguration>();

  parsingListForm = new FormGroup({
    parsingConfiguration: new FormControl<ParsingConfiguration>(null, Validators.required),
  });

  parsingConfigurationControl = this.parsingListForm.controls.parsingConfiguration;

  ngOnInit(): void {
    super.ngOnInit();
    this._setInitialSelections();
    this.parsingListForm.statusChanges
      .pipe(
        startWith<FormControlStatus>(this.parsingListForm.status),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((value: FormControlStatus) => {
        this.formState.emit(value);
      });
  }

  onParsingChanged(parsingConfigurations: ParsingConfiguration[]): void {
    const parsingConfiguration = parsingConfigurations.length ? parsingConfigurations[0] : null;
    this.parsingConfigurationControl.setValue(parsingConfiguration);
    this.parsingChanged.emit(parsingConfiguration);
  }

  private _setInitialSelections(): void {
    this.initialSelectionId = this.jobFormBuilderService.getValue('parsing_configuration.id');
  }
}
