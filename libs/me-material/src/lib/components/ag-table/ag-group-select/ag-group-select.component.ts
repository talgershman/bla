import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  input,
  OnInit,
  output,
  Signal,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MeGroupByItem} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Observable} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'me-ag-group-select',
  templateUrl: './ag-group-select.component.html',
  styleUrls: ['./ag-group-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeSelectComponent, ReactiveFormsModule],
})
export class MeAgGroupSelectComponent implements OnInit {
  groupByOptions = input.required<Array<MeGroupByItem>>();

  @Input()
  componentId: string;

  @Input()
  initialGroupByParam: string;

  @Input()
  resetControl$: Observable<boolean>;

  groupChanged = output<string>();

  selectOptions: Signal<Array<MeSelectOption>> = computed(() => {
    const options = this.groupByOptions();
    return options.map((option: MeGroupByItem) => {
      return {
        id: option.groups.map((item) => item.colId).join('-'),
        value: option.title,
      } as MeSelectOption;
    });
  });

  control = new FormControl();
  placeholder = 'place for title';

  private readonly USER_PREFERENCE_KEY = 'groupSelectionState';

  private userPreferencesService = inject(MeUserPreferencesService);

  ngOnInit(): void {
    this.resetControl$.pipe(untilDestroyed(this)).subscribe((_) => this._resetControlValue());
    this.control.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((optionId: string) => {
        this._onValueChanged(optionId);
      });
    this._restoreUserPreferences();
  }

  private _onValueChanged(optionId: string): void {
    const data = this.userPreferencesService.getComponentState(this.componentId);
    const nextData = {
      ...(data || {}),
      [this.USER_PREFERENCE_KEY]: optionId,
    };
    this.userPreferencesService.setComponentState(this.componentId, nextData);
    this.groupChanged.emit(optionId);
  }

  private _restoreUserPreferences(): void {
    const option =
      this._getValidQueryParamOption() ||
      this._getOptionFromUserPref() ||
      this.selectOptions()[0].id;

    this.control.setValue(option);
  }

  private _isValidOption(optionId: string): boolean {
    return this.selectOptions()
      .map((option) => option.id)
      .includes(optionId);
  }

  private _getOptionFromUserPref(): string {
    const data = this.userPreferencesService.getComponentState(this.componentId);
    const optionId = data?.[this.USER_PREFERENCE_KEY];
    return this._isValidOption(optionId) ? optionId : null;
  }

  private _getValidQueryParamOption(): string {
    if (
      this.initialGroupByParam &&
      this.selectOptions()
        .map((option: MeSelectOption) => option.id)
        .includes(this.initialGroupByParam)
    ) {
      return this.initialGroupByParam;
    }
    return null;
  }

  private _resetControlValue(): void {
    const firstColId = this.selectOptions()[0].id;
    this.control.setValue(firstColId);
  }
}
