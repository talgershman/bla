import {ChangeDetectionStrategy, Component, inject, Input, OnInit, ViewChild} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {Params} from '@angular/router';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SelectPerfectListComponent} from 'deep-ui/shared/components/src/lib/selection/select-perfect-list';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {PerfectList} from 'deep-ui/shared/models';
import _difference from 'lodash-es/difference';
import _every from 'lodash-es/every';
import _uniq from 'lodash-es/uniq';
import {distinctUntilChanged} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-perfect-list-step',
  templateUrl: './perfect-list-step.component.html',
  styleUrls: ['./perfect-list-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, SelectPerfectListComponent],
})
export class PerfectListStepComponent extends BaseStepDirective implements OnInit {
  @ViewChild(SelectPerfectListComponent) selectPerfectListComponent: SelectPerfectListComponent;

  @Input()
  savedPerfectListIds: Array<number>;

  @Input()
  readOnlySavedPerfectListIds: boolean;

  @Input()
  selectedPerfectListIds: Array<number>;

  @Input()
  initialTableFilters: Params;

  private fb = inject(FormBuilder);

  perfectListForm = this.fb.group(
    {
      syncListsIds: new FormControl<Array<number>>([]),
      perfectListsIds: new FormControl<Array<number>>([], {
        asyncValidators: () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(this._isSameTechnology());
            });
          }),
      }),
      inValid: new FormControl([]),
    },
    {
      validators: (_: FormGroup): ValidationErrors => {
        if (this.perfectListForm?.controls.inValid.value?.length) {
          return {valid: false};
        }
        if (this.selectedPerfectListIds?.length) {
          if (this.perfectListForm.controls.perfectListsIds.value?.length) {
            return null;
          }
          return {valid: false};
        }
        return this._isCustomRequired();
      },
    },
  );

  ngOnInit(): void {
    this._initForm();
    this._registerEvents();
    this.formState.emit(this.perfectListForm.status);
  }

  onPerfectListsChanged(perfectLists: PerfectList[]): void {
    const nextValue = perfectLists?.map((list) => list.id) || null;
    this.perfectListForm.controls.perfectListsIds.setValue(nextValue);
  }

  getEffectedPerfectListIds(): Array<number> {
    if (!this.perfectListForm) {
      return [];
    }
    return _uniq([...this._getSyncListsIds(), ...this._getNewPerfectListIds()]);
  }

  getEffectedSyncLists(): Array<PerfectList> {
    return [
      ...(this.selectPerfectListComponent?.syncPerfectLists || []),
      ...(this.selectPerfectListComponent?.selectedPerfectLists || []),
    ];
  }

  onSyncListsChanged(perfectLists: PerfectList[]): void {
    const nextValue = perfectLists.map((list) => list.id);
    this.perfectListForm.controls.syncListsIds.setValue(nextValue);
  }

  onInvalidAdded(id: number): void {
    this.perfectListForm.controls.inValid.setValue([
      ...(this.perfectListForm.controls.inValid.value || []),
      id,
    ]);
  }

  onInvalidRemoved(id: number): void {
    const firstInValidIndex = this.perfectListForm.controls.inValid.value?.findIndex(
      (inValidId: number) => inValidId === id,
    );
    const newVal = [...this.perfectListForm.controls.inValid.value];
    newVal.splice(firstInValidIndex, 1);
    this.perfectListForm.controls.inValid.setValue(newVal);
  }

  private _initForm(): void {
    this.perfectListForm.controls.perfectListsIds.setValue(
      this.savedPerfectListIds || this.selectedPerfectListIds,
    );
  }

  private _registerEvents(): void {
    this.perfectListForm.statusChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((value: FormControlStatus) => this.formState.emit(value));
  }

  private _isCustomRequired(): ValidationErrors {
    if (this.selectedPerfectListIds?.length) {
      return this.perfectListForm.controls.perfectListsIds?.value?.length
        ? null
        : {isCustomRequired: false};
    }
    return this.getEffectedPerfectListIds()?.length ? null : {isCustomRequired: false};
  }

  private _getNewPerfectListIds(): Array<number> {
    const allSelectedPerfectListIds: Array<number> =
      this.perfectListForm.controls.perfectListsIds?.value || [];
    if (!allSelectedPerfectListIds.length) {
      return [];
    }
    return _difference(allSelectedPerfectListIds, this.savedPerfectListIds) || [];
  }

  private _getSyncListsIds(): Array<number> {
    return this.perfectListForm.controls.syncListsIds.value || [];
  }

  private _isSameTechnology(): ValidationErrors {
    const effectPerfectLists: Array<PerfectList> = this.getEffectedSyncLists();
    if (effectPerfectLists?.length < 1) {
      return null;
    }
    return !_every(effectPerfectLists, {technology: effectPerfectLists[0].technology})
      ? {isSameTechnology: 'All Perfect lists must have the same technology'}
      : null;
  }
}
