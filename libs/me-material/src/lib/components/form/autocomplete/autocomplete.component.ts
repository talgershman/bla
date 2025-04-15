import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatOption, MatOptionModule} from '@angular/material/core';
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
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _findIndex from 'lodash-es/findIndex';
import _get from 'lodash-es/get';
import _isEqual from 'lodash-es/isEqual';
import {OnChange} from 'property-watch-decorator';
import {BehaviorSubject} from 'rxjs';
import {debounceTime, distinctUntilChanged, startWith, tap} from 'rxjs/operators';
import {Placement} from 'tippy.js';

import {MeAutoCompleteOption} from './autocomplete-entites';

@UntilDestroy()
@Component({
  selector: 'me-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HintIconComponent,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MeTooltipDirective,
    MeHighlightTextDirective,
    MatChipsModule,
    AsyncPipe,
  ],
  host: {
    '[id]': 'id',
    '[title]': 'title',
  },
  animations: [MeFadeInOutAnimation],
  providers: [{provide: MatFormFieldControl, useExisting: MeAutocompleteComponent}],
})
export class MeAutocompleteComponent extends MeBaseFormFieldControlDirective<any> {
  @ViewChild('searchInput') searchInput: ElementRef;

  @ViewChild(MatAutocompleteTrigger, {static: false})
  trigger: MatAutocompleteTrigger;

  @ViewChild(MatAutocomplete, {static: false}) autocomplete: MatAutocomplete;

  @Input()
  isLoading: boolean;

  @Input()
  tooltipPosition: Placement = 'right';

  @Input()
  addNewItemOption: boolean;

  @Input()
  @OnChange<MeAutoCompleteOption[] | string[]>('_onOptionsChanged')
  options: MeAutoCompleteOption[] | string[];

  @Input()
  @OnChange<MeAutoCompleteOption[] | string[]>('_onDisabledOptionsChanged')
  disabledOptions: MeAutoCompleteOption[] | string[];

  @HostBinding('style.--width')
  @Input()
  width: string;

  @Output()
  selectionChanged = new EventEmitter<MatAutocompleteSelectedEvent>();

  filteredOptionsSubscription = new BehaviorSubject<MeAutoCompleteOption[]>([]);

  filteredOptions$ = this.filteredOptionsSubscription.asObservable().pipe(untilDestroyed(this));

  disabledOptionsIds: Array<string> = [];

  showCloseButton: boolean;

  controlType = 'me-autocomplete';

  id = `me-autocomplete-${MeAutocompleteComponent.nextId++}`;

  private _options: MeAutoCompleteOption[];

  private savedInputValue: string;

  private originalOptions: MeAutoCompleteOption[];

  private destroyed = false;

  ngOnInit(): void {
    this.innerController.valueChanges
      .pipe(
        startWith(this.innerController.value),
        debounceTime(200),
        distinctUntilChanged(),
        tap((value) => {
          let result = value;
          if (typeof value === 'object') {
            result = value && value.name ? value.name : '';
          }
          if (this.originalOptions?.length) {
            const filteredOptions = this._filterOptions(result);
            this._updateNewOptions(filteredOptions);
          }
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroyed = true;
    this.trigger?.closePanel();
  }

  getFocusHTMLElement(): HTMLElement {
    return this.searchInput.nativeElement;
  }

  open(): void {
    setTimeout(() => {
      this.trigger?.openPanel();
    }, 500);
  }

  setValue(id: string): void {
    setTimeout(() => {
      this.autocomplete?.options.forEach((item) => {
        if (item.value.id === id) {
          item.select();
          if (this.searchInput) {
            this.searchInput.nativeElement.value = item.value?.name;
          }
          this.innerController?.setValue(item.value);
        }
      });
    });
  }

  clear(): void {
    setTimeout(() => {
      const options = this.autocomplete.options.toArray();
      options?.forEach((item) => item.deselect());
      this.innerController?.setValue(null);
      if (this.searchInput) {
        this.searchInput.nativeElement.value = '';
      }
      this.onChange(this.value);
      //emit selection after the control value is updated.
      setTimeout(() => {
        this.selectionChanged.emit(this.value);
      });
    });
  }

  onClearTermClicked(_: MouseEvent, trigger: MatAutocompleteTrigger): void {
    const selected = this._getSelectedOption();
    selected?.deselect();
    trigger.openPanel();
    this.innerController.setValue(null);
    this.onValueChange(null);
  }

  onSearchEnterKey(event: Event, trigger: MatAutocompleteTrigger): void {
    event.stopPropagation();
    event.preventDefault();
    this._onSearchEnterKeyInner(trigger);
  }

  displayFn(item: MeAutoCompleteOption): string {
    return _get(item, 'name');
  }

  focus(): void {
    this.searchInput.nativeElement.focus();
  }

  onValueChange(event: MatAutocompleteSelectedEvent): void {
    event?.option?.select();
    this.searchInput.nativeElement.value = event?.option?.value?.name;
    this.innerController.setValue(event?.option?.value);
    this.onChange(this.value);
    this._handlePanelClose();
    //emit selection after the control value is updated.
    setTimeout(() => {
      this.selectionChanged.emit(this.value);
    });
  }

  onNewItemClicked(): void {
    const value = this.innerController.value;
    const found = _find(this._options, {id: value});
    if (value && !found) {
      const newItem: MeAutoCompleteOption = {
        name: value,
        id: value,
      };
      this.options = [newItem, ...this.originalOptions];
      // update after autocomplete options cd
      setTimeout(() => {
        const options = this.autocomplete.options.toArray();
        // always will be the second node in the array
        if (options[1]?.value && !this.disabledOptionsIds.includes(options[1].value)) {
          this.innerController.setValue(options[1].value);
          options[1].select();
          const newEvent = new MatAutocompleteSelectedEvent({} as any, options[1]);
          this.onValueChange(newEvent);
        }
      });
    }
  }

  @debounce(150)
  onSearchKeyPressed(event: Event): void {
    event.stopPropagation();
    this.savedInputValue = (event.target as HTMLInputElement).value;
  }

  onFocusOut(_: FocusEvent) {
    //need to re-trigger error state because when the menu opens it hides the error.
    setTimeout(() => {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }, 50);
  }

  onPanelOpened(): void {
    this._updateNewOptions(this.originalOptions);
    this._scrollToSelectedOption();
    this.onFocusIn();
  }

  onInputBlur(): void {
    if (this.addNewItemOption) {
      return;
    } else {
      const option = this._getSelectedOption();
      if (!option) {
        this._handlePanelClose();
      }
    }
  }

  onPasteInput(event: ClipboardEvent, trigger: MatAutocompleteTrigger): void {
    const value = event?.clipboardData?.getData('text')?.trim() || '';
    this.savedInputValue = value;
    const options = this.autocomplete.options.toArray();
    const selectedOptions = _filter(
      options,
      (option: MatOption) =>
        !!option?.value?.name?.toLowerCase().includes(this.savedInputValue?.toLowerCase()),
    );

    if (selectedOptions?.length === 1 && !selectedOptions[0].disabled) {
      //prevent duplicate input text ( text is also set in innerController.setValue)
      event.preventDefault();
      const selectedOption = selectedOptions[0];
      this.innerController.setValue(selectedOption.value);
      selectedOption.select();
      if (trigger) {
        trigger?.closePanel();
      }
      const newEvent = new MatAutocompleteSelectedEvent({} as any, selectedOption);
      this.onValueChange(newEvent);
    }
  }

  private _getSelectedOption(): MatOption {
    const selectedOptionIndex = this._findSelectedOptionIndex();
    if (selectedOptionIndex !== -1) {
      return this.autocomplete.options.toArray()[selectedOptionIndex];
    }
    return null;
  }

  private _updateNewOptions(options: Array<MeAutoCompleteOption>): void {
    this.filteredOptionsSubscription.next(options);
  }

  private _findSelectedOptionIndex(): number {
    const options = this.autocomplete.options.toArray();
    return _findIndex(options, (option: MatOption) => option.selected);
  }

  private _onSearchEnterKeyInner(trigger: MatAutocompleteTrigger): void {
    if (this.addNewItemOption) {
      this.onNewItemClicked();
      return;
    }
    //already selected
    if (this.value) {
      return;
    }
    this.savedInputValue = this.innerController?.value?.name || this.innerController?.value;
    const options = this.autocomplete.options.toArray();
    let selectedOption: any;
    if (!this.addNewItemOption && options.length === 1) {
      selectedOption = options[0];
    } else {
      selectedOption = _find(
        options,
        (option: MatOption) =>
          option?.value?.name?.toLowerCase() === this.savedInputValue?.toLowerCase(),
      );
      if (!selectedOption) {
        selectedOption = _find(options, (option: MatOption) =>
          option?.value?.name?.toLowerCase().includes(this.savedInputValue?.toLowerCase()),
        );
      }
    }
    if (selectedOption && !selectedOption.disabled) {
      this.innerController.setValue(selectedOption.value);
      selectedOption.select();
      if (trigger) {
        trigger?.closePanel();
      }
      const newEvent = new MatAutocompleteSelectedEvent({} as any, selectedOption);
      this.onValueChange(newEvent);
    } else if (this.addNewItemOption) {
      this.onNewItemClicked();
    } else {
      this.innerController.setValue('');
    }
  }

  private _onOptionsChanged(options: MeAutoCompleteOption[] | string[]): void {
    if (options?.length) {
      const newOptions: Array<MeAutoCompleteOption> = this._convertToMeAutoCompleteOption(options);
      if (_isEqual(newOptions, this.originalOptions)) {
        return;
      }
      this._options = newOptions;
    } else {
      this._options = [];
    }
    this.originalOptions = this._options;
    this._updateNewOptions(this._options);
  }

  private _onDisabledOptionsChanged(options: MeAutoCompleteOption[] | string[]): void {
    if (options?.length) {
      this._options = this._convertToMeAutoCompleteOption(options);
    } else {
      this._options = [];
    }
    this.disabledOptionsIds = this._options.map((option: MeAutoCompleteOption) => option.id);
  }

  private _convertToMeAutoCompleteOption(
    options: MeAutoCompleteOption[] | string[],
  ): MeAutoCompleteOption[] {
    if (typeof options[0] === 'string' || options[0] instanceof String) {
      const stringOptions = options as string[];
      const convertedOptions: MeAutoCompleteOption[] = [];
      for (const option of stringOptions) {
        convertedOptions.push({
          id: option,
          name: option,
        });
      }
      return convertedOptions;
    }
    return options as MeAutoCompleteOption[];
  }

  private _filterOptions(value: string): MeAutoCompleteOption[] {
    if (!value) {
      return this.originalOptions;
    }
    return this.originalOptions.filter((option: MeAutoCompleteOption) =>
      option.name.toLowerCase().includes(value.toLowerCase()),
    );
  }
  private _scrollToSelectedOption(): void {
    if (this.destroyed) {
      return;
    }
    // will retry to scroll to selected option every 300ms
    setTimeout(() => {
      const panel = this.autocomplete?.panel?.nativeElement;
      if (panel) {
        const option = this._getSelectedOption();
        if (option) {
          const id = option.id;
          const element = document.getElementById(id);
          panel.scrollTop = element.offsetTop;
        }
      } else {
        //retry
        this._scrollToSelectedOption();
      }
    }, 300);
  }

  private _handlePanelClose(): void {
    const selectionDiff = this._isSelectionDiff();
    if (selectionDiff) {
      this.clear();
    }
    this.onFocusOut(null);
  }

  private _isSelectionDiff(): boolean {
    const value = this.value?.id ? this.value?.name?.toLowerCase() : '';
    const searchInput = this.searchInput.nativeElement.value
      ? this.searchInput.nativeElement.value.toLowerCase()
      : '';
    return value !== searchInput;
  }
}
