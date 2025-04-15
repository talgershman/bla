import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSlideToggleChange, MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MeOpacityAnimation} from '@mobileye/material/src/lib/animations';
import {AutocompleteChipsComponent} from '@mobileye/material/src/lib/components/form/autocomplete-chips';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import copy from 'copy-to-clipboard';
import {DatasourceService} from 'deep-ui/shared/core';
import {Datasource, QEAttribute, SelectedSubQuery} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _camelCase from 'lodash-es/camelCase';
import _find from 'lodash-es/find';
import _isEqual from 'lodash-es/isEqual';
import _startCase from 'lodash-es/startCase';
import _uniq from 'lodash-es/uniq';
import _values from 'lodash-es/values';
import {OnChange} from 'property-watch-decorator';
import {BehaviorSubject} from 'rxjs';
import {debounceTime, finalize, tap} from 'rxjs/operators';

export interface SubQueryItemOption {
  id: string;
  label: string;
}

@Component({
  selector: 'de-sub-query-square',
  templateUrl: './sub-query-square.component.html',
  styleUrls: ['./sub-query-square.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    AutocompleteChipsComponent,
    MatIconModule,
    MeTooltipDirective,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    AsyncPipe,
  ],
  animations: [MeOpacityAnimation],
})
export class SubQuerySquareComponent implements OnInit {
  @Input()
  datasource: Datasource;

  @OnChange<void>('_onSubQueryChanged')
  @Input()
  subQuery: SelectedSubQuery;

  @Input()
  index: number;

  @Input()
  selectedFields: Array<string>;

  @Input()
  materialized: boolean;

  @Input()
  disableSquare: boolean;

  @Input()
  isReadOnlyMode: boolean;

  @Input()
  markAsInvalid: boolean;

  @Output()
  subQueryFieldsUpdated = new EventEmitter<Array<string>>();

  @Output()
  materializedUpdated = new EventEmitter<boolean>();

  @Output()
  editSubQueryClicked = new EventEmitter<SelectedSubQuery>();

  @Output()
  deleteSubQueryClicked = new EventEmitter<number>();

  attributeObjectsOptions: Array<SubQueryItemOption>;

  attributeNameOptions: Array<string>;

  fieldsControl: FormControl<Array<string>>;

  showButtons: boolean;

  versionLabel: string;

  selectedAllFields: boolean;

  private _selectedFields: Array<string>;

  private loadingSubscription = new BehaviorSubject<boolean>(true);

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  private datasourceService = inject(DatasourceService);

  private snackbar = inject(MeSnackbarService);

  ngOnInit(): void {
    this._setVersionText();
    this._selectedFields = [...(this.selectedFields || [])];
    this.selectedAllFields = this.materialized;
  }

  onAddFieldsClicked(): void {
    this._getAttributeOptions();
  }

  onCloseFieldsMenu(): void {
    if (!this.fieldsControl) {
      return;
    }
    const fieldsIds = this._getFieldControlsIds();
    if (!_isEqual(fieldsIds, this.subQuery.query?.columns || [])) {
      this.subQueryFieldsUpdated.emit(fieldsIds);
    }
    if (fieldsIds.length && this.selectedAllFields) {
      this.selectedAllFields = false;
      this.materializedUpdated.next(this.selectedAllFields);
    }
  }

  @memoize((...args) => _values(args).join('_'))
  getFooterFieldsDisplayText(controlValue: any, columns: Array<string>): string {
    if (controlValue?.length) {
      return controlValue.join(', ');
    }
    if (columns?.length) {
      return columns.map((item) => this._convertToDisplayLabel(item)).join(', ');
    }
    return null;
  }

  copyControllerValueToClipboard(event: MouseEvent): void {
    event.stopPropagation();
    copy(this.fieldsControl.value.join(';'));
    this.snackbar.onCopyToClipboard();
  }

  onSelectAllFieldsChanged(event: MatSlideToggleChange): void {
    this.selectedAllFields = event.checked;
    this.materializedUpdated.next(this.selectedAllFields);
    if (this.selectedAllFields) {
      this.fieldsControl?.setValue([]);
      this.subQuery.query.columns = [];
      this._selectedFields = [];
      this.subQueryFieldsUpdated.next([]);
    }
  }

  private _getFieldControlsIds(): Array<string> {
    const options: Array<string> = [];
    for (const item of this.fieldsControl.value) {
      const option = _find(
        this.attributeObjectsOptions,
        (optionObj: SubQueryItemOption) => optionObj.label === item,
      );
      options.push(option.id);
    }
    return options;
  }

  private _getAttributeOptions(): void {
    if (this.attributeObjectsOptions?.length) {
      return;
    }
    this.loadingSubscription.next(true);
    this.datasourceService
      .getAttributes(this.datasource, this.subQuery?.version)
      .pipe(
        tap((validAttributes: Array<QEAttribute>) => {
          const validOptions = this._getValidAttributes(validAttributes);
          const allOptions = this.addInvalidAttributes(validOptions);
          this.attributeObjectsOptions = allOptions;
          const options = _uniq(allOptions.map((item) => item.label));
          this.attributeNameOptions = options.sort();
          this._initFieldsControl();
        }),
        finalize(() => this.loadingSubscription.next(false)),
      )
      .subscribe();
  }

  private _initFieldsControl(): void {
    this.fieldsControl = new FormControl([]);
    const initValue = this._selectedFields?.length ? [...this._selectedFields] : [];
    const convertToLabelValue = initValue.map((value) => this._convertToLabel(value));
    this.fieldsControl.setValue(convertToLabelValue);
    if (this._isInactive()) {
      this.fieldsControl.disable();
    }
  }

  private _convertToLabel(value: string): string {
    return _startCase(_camelCase(value));
  }

  private _isInactive(): boolean {
    return this.datasource.status === 'inactive';
  }

  private _getValidAttributes(validAttributes: Array<QEAttribute>): Array<SubQueryItemOption> {
    const options: Array<SubQueryItemOption> = [];
    for (const attribute of validAttributes) {
      options.push({
        id: attribute.columnName,
        label: this._convertToDisplayLabel(attribute.columnName),
      });
    }
    return options;
  }

  private addInvalidAttributes(options: Array<SubQueryItemOption>): Array<SubQueryItemOption> {
    for (const field of this._selectedFields || []) {
      const found = _find(
        options,
        (option: string) => option === this._convertToDisplayLabel(option),
      );
      if (!found) {
        options.push({
          id: field,
          label: this._convertToLabel(field),
        });
      }
    }
    return options;
  }

  private _convertToDisplayLabel(text: string): string {
    return _startCase(_camelCase(text));
  }

  private _setVersionText(): void {
    if (!this.datasource?.versioned || !this.subQuery) {
      return;
    }
    if (this.subQuery.userFacingVersion) {
      this.versionLabel = `(Version ${this.subQuery.userFacingVersion})`;
    } else {
      this.versionLabel = '(Latest)';
    }
  }

  private _onSubQueryChanged(): void {
    this._setVersionText();
  }
}
