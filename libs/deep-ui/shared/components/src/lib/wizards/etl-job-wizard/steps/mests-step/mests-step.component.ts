import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnInit,
  Output,
} from '@angular/core';
import {FormBuilder, FormControl, FormControlStatus, Validators} from '@angular/forms';
import {Params} from '@angular/router';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  InitialMestSettings,
  SelectMestItem,
  ValidSelectedMest,
} from 'deep-ui/shared/components/src/lib/common';
import {
  MestFormComponent,
  MestFormStateEvent,
} from 'deep-ui/shared/components/src/lib/forms/mest-form';
import {SelectMestComponent} from 'deep-ui/shared/components/src/lib/selection/select-mest';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {SubmitJobFeedbackItem} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import {ClipList, MEST} from 'deep-ui/shared/models';
import {Observable} from 'rxjs';
import {distinctUntilChanged, startWith} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-mests-step',
  templateUrl: './mests-step.component.html',
  styleUrls: ['./mests-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectMestComponent, MestFormComponent],
})
export class MestsStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  enableSingleSelection = true;

  @Input()
  enableMultiSelection = false;

  @Input()
  requiredSelection: number;

  @Input()
  clipLists: Array<ClipList> = [];

  @Input()
  overrideDisplayColumns: Array<string> = [];

  @Input()
  overrideClicked: Observable<void>;

  @Input()
  backToListViewClicked: Observable<void>;

  @Output()
  stepLabelChange = new EventEmitter<string>();

  @Output()
  returnFromMestFormClicked = new EventEmitter<void>();

  @Output()
  showMestForm = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private ngZone = inject(NgZone);

  mestForm = this.fb.group({
    mest: new FormControl<Array<ValidSelectedMest>>(null, {validators: [Validators.required]}),
    mainVersion: new FormControl<MEST>(null),
  });

  selectedMest: MEST;

  updatedMest: SelectMestItem;

  submitJobFeedbackItems: SubmitJobFeedbackItem[] = [];

  showMestFormView: boolean;

  initialMestSettings: InitialMestSettings;

  initialTableFilters: Params;

  ngOnInit(): void {
    super.ngOnInit();
    this._setInitialSelections();
    this._initForm();
    this._registerEvents();
  }

  onMestFormBackClicked(): void {
    this.returnFromMestFormClicked.emit();
    this.showMestFormView = false;
    this.showMestForm.emit(false);
  }

  onActionClicked(action: MeAgTableActionItemEvent<MEST>): void {
    if (action.id === 'open_mest_form') {
      this.stepLabelChange.emit('Override MEST CMD');
      this.selectedMest = action.selected;
      this.showMestFormView = true;
      this.showMestForm.emit(true);
    }
  }

  async onActionClickedRunInZone(action: MeAgTableActionItemEvent<MEST>): Promise<void> {
    this.ngZone.run(this.onActionClicked.bind(this, action));
  }

  onMestValueChange(event: MestFormStateEvent): void {
    this.updatedMest = event.mest;
    this.returnFromMestFormClicked.emit();
    this.showMestFormView = false;
    this.showMestForm.emit(false);
  }

  onMestsSelectedChanged(validMests: ValidSelectedMest[]): void {
    this.mestForm.controls.mest.setValue(validMests);
  }

  onMainVersionChanged(mest: MEST): void {
    this.mestForm.controls.mainVersion.setValue(mest);
  }

  private _initForm(): void {
    this._setValidations();
  }

  private _setValidations(): void {
    if (this.requiredSelection) {
      this.mestForm.controls.mest.addValidators([
        Validators.required,
        Validators.minLength(this.requiredSelection),
      ]);
      this.mestForm.controls.mest.updateValueAndValidity();
      this.mestForm.controls.mainVersion.addValidators([Validators.required]);
      this.mestForm.controls.mainVersion.updateValueAndValidity();
    }
  }

  private _registerEvents(): void {
    this.mestForm.statusChanges
      .pipe(
        startWith<FormControlStatus>(this.mestForm.status),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((value: FormControlStatus) => this.formState.emit(value));

    this.backToListViewClicked
      ?.pipe(untilDestroyed(this))
      .subscribe(() => this.onMestFormBackClicked());
  }

  private _setInitialSelections(): void {
    const initialMestSettings = this.jobFormBuilderService.getValue(
      'metadata.mest_settings',
    ) as InitialMestSettings;
    //override not supported
    if (initialMestSettings?.is_override || !initialMestSettings?.root_path) {
      return;
    }
    this.initialMestSettings = initialMestSettings;
    this.initialTableFilters = initialMestSettings ? {id: this.initialMestSettings.id} : null;
  }
}
