import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  ViewChild,
} from '@angular/core';
import {ReactiveFormsModule, ValidationErrors} from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldControl, MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeBaseFormFieldControlDirective} from '@mobileye/material/src/lib/components/form';
import {MeHighlightTextDirective} from '@mobileye/material/src/lib/directives/highlight-text';
import {
  MeAzureGraphService,
  UserPropertiesType,
} from '@mobileye/material/src/lib/services/azure-graph';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import _find from 'lodash-es/find';
import {BehaviorSubject, filter, fromEvent, of} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

interface MeUserControlOption {
  displayName: string;
  userPrincipalName: string;
}

@UntilDestroy()
@Component({
  selector: 'me-user-control',
  templateUrl: './user-control.component.html',
  styleUrls: ['./user-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MeHighlightTextDirective,
    AsyncPipe,
    MatSelectModule,
    MatChipsModule,
  ],
  host: {
    '[id]': 'id',
    '[title]': 'title',
  },
  animations: [MeFadeInOutAnimation],
  providers: [{provide: MatFormFieldControl, useExisting: MeUserControlComponent}],
})
export class MeUserControlComponent extends MeBaseFormFieldControlDirective<string> {
  @ViewChild('searchInput', {static: false}) inputElem: ElementRef;

  @ViewChild('trigger', {static: false}) trigger: MatAutocompleteTrigger;

  @ViewChild('searchInput', {static: false}) set setSearchElem(elem: ElementRef) {
    if (elem) {
      fromEvent(elem.nativeElement, 'keyup')
        .pipe(
          filter((event: KeyboardEvent) => !event.key.startsWith('Arrow')),
          debounceTime(200),
          distinctUntilChanged(),
          switchMap((event: KeyboardEvent) => {
            const key = 'value';
            const value = event.target[key];
            if (!value) {
              return of(null);
            }
            this.loadingSubscription.next(true);
            return this.azureGraphService.getUsersByDisplayName(value, this.searchByProperty);
          }),
          catchError(() => of(null)),
          untilDestroyed(this),
        )
        .subscribe((data) => {
          this.loadingSubscription.next(false);
          const newOptions = this._convertResultsToOptions(data);
          this.options.next(newOptions);
        });
    }
  }

  @ViewChild(MatAutocomplete, {static: false}) autocomplete: MatAutocomplete;

  @Input()
  isTouched: boolean;

  @Input()
  errors: ValidationErrors;

  @Input()
  propertyToDisplay: UserPropertiesType = 'displayName';

  @Input()
  searchByProperty: UserPropertiesType = 'givenName';

  controlType = 'me-user-control';
  id = `me-user-control'-${MeUserControlComponent.nextId++}`;

  getFocusHTMLElement(): HTMLElement {
    return this.inputElem.nativeElement;
  }

  // eslint-disable-next-line
  private options = new BehaviorSubject<MeUserControlOption[]>([]);

  // eslint-disable-next-line
  options$ = this.options.asObservable();

  // eslint-disable-next-line
  private loadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  // eslint-disable-next-line
  private azureGraphService = inject(MeAzureGraphService);

  onClearClicked(): void {
    this.innerController.setValue(null);
    this.onChange(this.value);
    this.trigger.closePanel();
  }

  displayFn(item: MeUserControlOption): string {
    if (item) {
      return item[this.propertyToDisplay] ? item[this.propertyToDisplay] : item.toString();
    }
    return '';
  }

  onOptionSelected(autocompleteSelectedEvent: MatAutocompleteSelectedEvent): void {
    this.innerController.setValue(autocompleteSelectedEvent.option.value[this.propertyToDisplay]);
    this.onChange(this.value);
    this.options.next([]);
  }

  onPanelClosed(): void {
    const options = this.autocomplete.options.toArray();
    const selectedOption = _find(options, (option) => option.selected);
    if (!selectedOption && options.length && options[0]?.value !== undefined) {
      this.innerController.setValue(options[0].value[this.propertyToDisplay]);
      this.onChange(this.value);
      this.options.next([]);
    }
    this.onFocusOut(null);
  }

  onPanelOpened(): void {
    this.onFocusIn();
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

  private _convertResultsToOptions(response: any): MeUserControlOption[] {
    return response && response.value ? response.value : [];
  }
}
