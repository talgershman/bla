import {IFilterAngularComp} from '@ag-grid-community/angular';
import {IDoesFilterPassParams, IFilterParams} from '@ag-grid-community/core';
import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeHighlightTextDirective} from '@mobileye/material/src/lib/directives/highlight-text';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BehaviorSubject, fromEvent, of} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';

interface MeUserAutocompleteOption {
  displayName: string;
}

@UntilDestroy()
@Component({
  selector: 'me-ag-user-autocomplete-filter',
  templateUrl: './ag-user-autocomplete-filter.component.html',
  styleUrls: ['./ag-user-autocomplete-filter.component.scss'],
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
    MatChipsModule,
  ],
})
export class MeAgUserAutocompleteFilterComponent implements IFilterAngularComp, OnInit {
  @ViewChild('trigger', {static: false}) trigger: MatAutocompleteTrigger;

  @ViewChild('searchInput', {static: false}) set setSearchElem(elem: ElementRef) {
    if (elem) {
      fromEvent(elem.nativeElement, 'keyup')
        .pipe(
          debounceTime(200),
          distinctUntilChanged(),
          switchMap((event: KeyboardEvent) => {
            const key = 'value';
            const value = event.target[key];
            if (!value) {
              return of(null);
            }
            this.loadingSubscription.next(true);
            return this.azureGraphService.getUsersByDisplayName(value);
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

  valueControl: FormControl;
  params: IFilterParams;
  placeholder: string;
  clearable: boolean;

  //eslint-disable-next-line
  private options = new BehaviorSubject<Array<MeUserAutocompleteOption>>([]);

  // eslint-disable-next-line
  options$ = this.options.asObservable();

  // eslint-disable-next-line
  private loadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  private azureGraphService = inject(MeAzureGraphService);

  ngOnInit(): void {
    this.valueControl = new FormControl();
  }

  agInit(params: IFilterParams): void {
    this.params = params;
    this.placeholder = params.colDef.filterParams.filterPlaceholder;
    this.clearable =
      (params.colDef.filterParams.buttons as Array<string>)?.includes('clear') ?? false;
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    return this.valueControl.value === params.data[this.params.colDef.field];
  }

  getModel(): any {
    if (!this.isFilterActive()) {
      return null;
    }
    return {filterType: 'text', type: 'equals', filter: this.valueControl.value};
  }

  isFilterActive(): boolean {
    return (
      this.valueControl.value !== null &&
      this.valueControl.value !== undefined &&
      this.valueControl.value !== ''
    );
  }

  setModel(model: any): void {
    this.valueControl.setValue(model?.filter);
  }

  onOptionSelected($event: MatAutocompleteSelectedEvent): void {
    this.valueControl.setValue($event.option.value.displayName);
    this.options.next([]);
    this.params.filterChangedCallback();
  }

  onClearClicked(): void {
    this.valueControl.setValue(null);
    this.trigger.closePanel();
    this.params.filterChangedCallback();
  }

  displayFn(item: MeUserAutocompleteOption): string {
    if (item) {
      return item.displayName ? item.displayName : item.toString();
    }
    return '';
  }

  private _convertResultsToOptions(response: any): MeUserAutocompleteOption[] {
    return response && response.value ? response.value : [];
  }
}
