import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {AsyncPipe} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  ViewChild,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldControl, MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeBaseFormFieldControlDirective} from '@mobileye/material/src/lib/components/form';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeHighlightTextDirective} from '@mobileye/material/src/lib/directives/highlight-text';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {debounce} from 'lodash-decorators/debounce';
import _difference from 'lodash-es/difference';
import _filter from 'lodash-es/filter';
import _intersection from 'lodash-es/intersection';
import {BehaviorSubject} from 'rxjs';
import {debounceTime, startWith, tap} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'me-autocomplete-chips',
  templateUrl: './autocomplete-chips.component.html',
  styleUrls: ['./autocomplete-chips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatChipsModule,
    MeTooltipDirective,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatOptionModule,
    MeHighlightTextDirective,
    AsyncPipe,
    HintIconComponent,
  ],
  host: {
    '[id]': 'id',
    '[title]': 'title',
  },
  animations: [MeFadeInOutAnimation],
  providers: [{provide: MatFormFieldControl, useExisting: AutocompleteChipsComponent}],
})
export class AutocompleteChipsComponent
  extends MeBaseFormFieldControlDirective<any>
  implements AfterViewInit
{
  @ViewChild('inputElem') searchInput: ElementRef;

  @Input('options')
  originalOptions: string[];

  @HostBinding('style.--width')
  @Input()
  width: string;

  @ViewChild('inputElem') inputElem: ElementRef<HTMLInputElement>;

  @ViewChild(MatAutocompleteTrigger, {static: false})
  trigger: MatAutocompleteTrigger;

  @ViewChild(MatAutocomplete, {static: false}) autocomplete: MatAutocomplete;

  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  inputCtrl: FormControl<string>;

  // filteredOptions$: Observable<string[]>;

  controlType = 'me-autocomplete-chips';

  id = `me-autocomplete-chips-${AutocompleteChipsComponent.nextId++}`;

  filteredOptions = [];
  controlsSubject = new BehaviorSubject<Array<string>>([]);
  controls$ = this.controlsSubject.asObservable();
  searchStr: string;

  private readonly DELIMITER = ';';
  ngOnInit(): void {
    this.innerController.valueChanges
      .pipe(
        startWith(this.innerController.value),
        debounceTime(50),
        tap((value: Array<string>) => {
          const nextOptions = this._filterOptionsByArray(value);
          this.filteredOptions = nextOptions;
        }),
        untilDestroyed(this),
      )
      .subscribe((value) => {
        this.controlsSubject.next([...value]);
      });

    this.inputCtrl = this.innerController.disabled
      ? new FormControl({value: '', disabled: true})
      : new FormControl('');

    this.inputCtrl.valueChanges
      .pipe(
        tap((value: string) => {
          this.searchStr = value;
          const nextOptions = this._filterOptionsByValue(value);
          this.filteredOptions = nextOptions;
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.trigger?.closePanel();
  }

  getFocusHTMLElement(): HTMLElement {
    return this.searchInput.nativeElement;
  }

  onFocusOut(): void {
    if (this.inputCtrl.value) {
      this.inputElem.nativeElement.value = '';
    }
    this.touched = true;
    this.focused = false;
    this.onTouched();
    this.stateChanges.next();
  }

  @debounce(100)
  add(event?: MatChipInputEvent): void {
    const values = (this.inputElem.nativeElement.value || '').trim();
    if (values === '') {
      return;
    }

    const valuesArr = values.split(this.DELIMITER);
    if (valuesArr.length === 1 && this.filteredOptions.length) {
      const firstOption = this.filteredOptions[0];
      this._addValue(firstOption);
    } else {
      const optionsWithoutCurrentSelected = this._getOptionsWithoutCurrentSelected();
      const valuesToBeAdded = _intersection(valuesArr, optionsWithoutCurrentSelected) || [];
      this._addValues(valuesToBeAdded);
    }
    // Clear the input value
    if (event?.chipInput) {
      event.chipInput.clear();
    } else {
      setTimeout(() => (this.inputElem.nativeElement.value = ''));
    }
    this.inputCtrl.setValue('');
    this.innerController.markAsDirty();
  }

  addPastedValue(): void {
    this.add();
  }

  remove(index: number): void {
    if (index >= 0) {
      const currentArr = this.innerController.value || [];
      currentArr.splice(index, 1);
      this.innerController.setValue([...currentArr]);
      this.onChange(this.value);
    }
    this.innerController.markAsDirty();
    this.inputElem.nativeElement.value = '';
    this.inputCtrl.setValue('');
  }

  onValueChange(event: MatAutocompleteSelectedEvent, trigger: MatAutocompleteTrigger): void {
    this._addValue(event.option.viewValue);
    this.inputElem.nativeElement.value = '';
    this.inputCtrl.setValue('');
    //we need to override closePanel,because this is called after a option selected and closes our panel
    const originalClosePanel = trigger.closePanel.bind(trigger);
    trigger.closePanel = () => {
      //re-register to close actions
      const key = '_subscribeToClosingActions';
      trigger[key]();
      trigger.closePanel = originalClosePanel;
    };
  }

  onElemResize = (entry: ResizeObserverEntry): void => {
    const target = entry.target as HTMLElement;
    const {clientWidth, scrollWidth} = target;
    target['meElementTooltipDisabled'] = clientWidth === scrollWidth;
  };

  private _getOptionsWithoutCurrentSelected(): Array<string> {
    const currentValuesSet = new Set<string>(
      this.innerController.value.map((v: string) => v.toLowerCase()),
    );

    return this.originalOptions.filter(
      (option: string) => !currentValuesSet.has(option.toLowerCase()),
    );
  }

  private _addValue(value: string): void {
    const currentValue = this.innerController.value;
    if (!value || currentValue.includes(value)) {
      return;
    }
    const nextValues = [...currentValue, value];
    this.innerController.setValue(nextValues);
    this.onChange(this.value);
  }

  private _addValues(values: Array<string>): void {
    if (!values.length) {
      return;
    }
    const nextValues = [...this.innerController.value, ...values];
    this.innerController.setValue(nextValues);
    this.onChange(this.value);
  }

  private _filterOptionsByArray(controlValue: string[]): Array<string> {
    return _difference(this.originalOptions, controlValue);
  }

  private _filterOptionsByValue(value: string): Array<string> {
    const lowerCaseValue = value.trim().toLowerCase();
    const optionsWithoutCurrentSelected = this._getOptionsWithoutCurrentSelected();
    return _filter(optionsWithoutCurrentSelected, (item) =>
      item.toLowerCase().includes(lowerCaseValue),
    );
  }
}
