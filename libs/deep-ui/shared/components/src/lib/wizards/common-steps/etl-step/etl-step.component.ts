import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  input,
  Output,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormControlStatus,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {Params} from '@angular/router';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SelectEtlListComponent} from 'deep-ui/shared/components/src/lib/selection/select-etl-list';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {ETL, EtlTypeEnum} from 'deep-ui/shared/models';
import {OnChange} from 'property-watch-decorator';
import {distinctUntilChanged, startWith} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-etl-step',
  templateUrl: './etl-step.component.html',
  styleUrls: ['./etl-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectEtlListComponent, ReactiveFormsModule],
})
export class EtlStepComponent extends BaseStepDirective {
  @Input()
  etlType: EtlTypeEnum = EtlTypeEnum.VALIDATION;

  selectedEtl = input<ETL>();

  isNameControlDisabled = input<boolean>();

  @Input()
  @OnChange<void>('_onShown')
  wasShown: boolean;

  @Input()
  disabledRowCallback: (etl: ETL) => string;

  @Input()
  readonly: boolean;

  @Output()
  etlChanged = new EventEmitter<ETL>();

  EtlTypeEnum = EtlTypeEnum;

  etlListForm = new FormGroup({
    etl: new FormControl<ETL>(null, Validators.required),
  });

  stepInvalidCallback: (etl: ETL) => string;

  selectedEtlAfterValidation: ETL;

  initialSelectionGroupKey: WritableSignal<Record<string, string>> = signal({});

  initialFiltersValue: Signal<Params> = computed(() => {
    const filters = {
      name: this.isNameControlDisabled() ? this.selectedEtl()?.name : undefined,
      ...(this.initialSelectionGroupKey() || {}),
      type: this.etlType,
    };
    return filters;
  });

  initialTableFilters: Signal<Params> = computed(() =>
    this.getInitialTableFilters(null, this.initialFiltersValue()),
  );

  viewState = computed(() => {
    return {
      selectedEtl: this.selectedEtl(),
      derivedLogic: computed(() => {
        this._onSelectedEtlChanged();
        return null;
      }),
    };
  });

  onEtlsChanged(etls: ETL[]): void {
    const etl = etls.length ? etls[0] : null;
    const etlAfterValidation = this._getSelectedEtlAfterValidation(etl);
    this.etlListForm.controls.etl.setValue(etlAfterValidation);
    this.etlChanged.emit(etlAfterValidation);
  }

  private _onShown(): void {
    if (this.wasShown) {
      this._setInitialSelections();
      this.selectedEtlAfterValidation = this._getSelectedEtlAfterValidation(this.selectedEtl());
      this.etlListForm.controls.etl.setValue(this.selectedEtlAfterValidation);
      this.etlListForm.statusChanges
        .pipe(
          startWith<FormControlStatus>(this.etlListForm.status),
          distinctUntilChanged(),
          untilDestroyed(this),
        )
        .subscribe((value: FormControlStatus) => this.formState.emit(value));

      this.stepInvalidCallback = this._getInvalidCallback();
    } else {
      this.onEtlsChanged([]);
      this.jobFormBuilderService.resetAll();
    }
  }

  private _stepEtlValidation(etl: ETL): string {
    if (!etl || !etl.type) {
      return '';
    }
    if (this.isNameControlDisabled() && etl.name !== this.selectedEtl().name) {
      return "You can't change the ETL";
    }
    if (etl.type !== this.etlType) {
      return 'Invalid ETL type';
    }
    if (etl?.sdkStatus?.status === 'deprecated') {
      return etl.sdkStatus.msg;
    }
    return '';
  }

  private _getInvalidCallback(): (etl: ETL) => string {
    return (etl: ETL): string => {
      const stepEtlValidation = this._stepEtlValidation(etl);

      if (stepEtlValidation) {
        return stepEtlValidation;
      }

      const callback = this.disabledRowCallback;

      if (callback) {
        return callback(etl);
      }

      return '';
    };
  }

  private _getSelectedEtlAfterValidation(etl: ETL): ETL {
    if (this._stepEtlValidation(etl)) {
      return null;
    }

    return etl;
  }

  private _onSelectedEtlChanged(): void {
    const etlValue = this.selectedEtl() ? this.selectedEtl() : null;
    this.selectedEtlAfterValidation = this._getSelectedEtlAfterValidation(etlValue);
    this.etlListForm?.get('etl')?.setValue(this.selectedEtlAfterValidation);
  }

  private _setInitialSelections(): void {
    this.initialSelectionId =
      this.jobFormBuilderService.getValue('probe_id') || this.selectedEtl()?.id;
    const nameFilter =
      this.jobFormBuilderService.getValue('probe_name') || this.selectedEtl()?.name;
    if (nameFilter && nameFilter !== 'Data Creation') {
      this.initialSelectionGroupKey.set({
        name: nameFilter,
      });
    }
  }
}
