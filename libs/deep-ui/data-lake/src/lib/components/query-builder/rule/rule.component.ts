import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {
  MeAutocompleteComponent,
  MeAutoCompleteOption,
} from '@mobileye/material/src/lib/components/form/autocomplete';
import {AutocompleteChipsComponent} from '@mobileye/material/src/lib/components/form/autocomplete-chips';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {booleanOptions, QEAttribute, QERule, ValueComponentType} from 'deep-ui/shared/models';
import _find from 'lodash-es/find';
import {OnChange} from 'property-watch-decorator';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';

import {RuleService} from './rule.service';

export interface Rule {
  key: string;
  operator: any;
  value: any;
}

@UntilDestroy()
@Component({
  selector: 'de-rule',
  templateUrl: './rule.component.html',
  styleUrls: ['./rule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeAutocompleteComponent,
    MeSelectComponent,
    MeInputComponent,
    AutocompleteChipsComponent,
    MeFormControlChipsFieldComponent,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
})
export class RuleComponent implements OnInit {
  @Input()
  attributes: Array<QEAttribute>;

  @Input()
  selectedRule: Rule;

  @Input()
  rulesGroup: FormGroup<any>;

  @Input()
  rule: QERule;

  @Input()
  readonly: boolean;

  @OnChange<void>('_onIsTouched')
  @Input()
  isTouched: boolean;

  @Output()
  deleteClicked = new EventEmitter<void>();

  private ruleService = inject(RuleService);
  private fb = inject(FormBuilder);

  controlsRulesGroup: FormGroup<any>;

  keyControl: FormControl<MeAutoCompleteOption>;

  operatorControl: FormControl<string>;

  valueControl: FormControl<any>;

  typeControl: FormControl<string>;

  arrValueControl: FormControl<Array<string>>;

  showIcons: boolean;

  attributeOptions: Array<MeAutoCompleteOption>;

  operatorOptions: Array<MeSelectOption>;

  valueOptions: Array<string> | Array<MeSelectOption>;

  valueComponentType: ValueComponentType;

  separatorKeysCodes = [ENTER, COMMA];

  readonly arrayStringTypeComponent = 'array<string>';

  private _invalidAttributes: Array<QEAttribute> = [];

  private _invalidRuleValues: Array<string> = [];

  // eslint-disable-next-line
  @HostListener('mouseenter') onHover() {
    this.showIcons = true;
  }

  // eslint-disable-next-line
  @HostListener('mouseleave') onLeave() {
    this.showIcons = false;
  }

  ngOnInit(): void {
    this._setInvalidOptions();
    this._initForm();
    this._registerEvents();
    this._setAttributeOptions();
    this._loadData();
    if (this.rule) {
      this.controlsRulesGroup.markAllAsTouched();
    }
  }

  onAttributeChanged(): void {
    const attr = this.keyControl.value;
    this._resetValueControls();
    this._setValueOptions(attr?.entity);
    this._setOperatorOptions(attr?.entity);
    this._setDefaultOperator();
    this._setValueComponentType();
    this._setReadOnlyMode();
  }

  onOperatorChanged(): void {
    this._resetValueControls();
    this._handleValueValidation();
    this._setValueComponentType();
  }

  private _setReadOnlyMode(): void {
    if (this.readonly) {
      this.controlsRulesGroup.disable();
    }
  }

  private _setInvalidOptions(): void {
    this._invalidAttributes = this.ruleService.getInvalidAttributes(this.rule, this.attributes);
    this._invalidRuleValues = this.ruleService.getInvalidRuleValues(this.rule, this.attributes);
  }

  private _initForm(): void {
    this._initFromBuilder();
    this._defineControls();
  }

  private _registerEvents(): void {
    this.controlsRulesGroup.valueChanges
      .pipe(
        debounceTime(150),
        map((formValue: any) =>
          this.ruleService.getSerializeForm(this.controlsRulesGroup, formValue),
        ),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((nextValue: any) => {
        this.rulesGroup.setValue(nextValue);
      });
  }

  private _initFromBuilder(): void {
    this.controlsRulesGroup = this.fb.group({
      key: new FormControl<MeAutoCompleteOption>(
        null,
        !this.readonly
          ? Validators.compose([
              Validators.required,
              MeFormValidations.arrayInvalidValues(
                this._invalidAttributes.map((item) => item.columnName),
              ),
            ])
          : null,
      ),
      operator: new FormControl<string>(null, !this.readonly ? Validators.required : null),
      type: new FormControl<string>(null, !this.readonly ? Validators.required : null),
    });
    this.rulesGroup.addControl(
      'key',
      new FormControl<string>(null, !this.readonly ? Validators.required : null),
    );
    this.rulesGroup.addControl(
      'operator',
      new FormControl<string>(null, !this.readonly ? Validators.required : null),
    );
    this.rulesGroup.addControl(
      'value',
      new FormControl<any>(null, !this.readonly ? Validators.required : null),
    );
    this.rulesGroup.addControl(
      'type',
      new FormControl<string>(null, !this.readonly ? Validators.required : null),
    );
    if (Array.isArray(this.rule?.value)) {
      this._addArrValueControl();
    } else {
      this._addValueControl();
    }
  }

  private _addValueControl(): void {
    if (!this.controlsRulesGroup.controls.value) {
      this.controlsRulesGroup.addControl(
        'value',
        new FormControl<any>(
          null,
          !this.readonly ? Validators.compose(this._getValueControlValidations()) : null,
        ),
      );
      this.valueControl = this.controlsRulesGroup.controls.value as FormControl<any>;
    }
  }

  private _removeValueControl(): void {
    if (this.controlsRulesGroup.controls.value) {
      this.controlsRulesGroup.removeControl('value');
      this.valueControl = null;
    }
  }

  private _addArrValueControl(): void {
    if (!this.controlsRulesGroup.controls.arrValue) {
      this.controlsRulesGroup.addControl(
        'arrValue',
        new FormControl(
          [],
          !this.readonly ? Validators.compose(this._getValueControlValidations()) : null,
        ),
      );
      this.arrValueControl = this.controlsRulesGroup.controls.arrValue as FormControl;
    }
  }

  private _removeArrValueControl(): void {
    if (this.controlsRulesGroup.controls.arrValue) {
      this.controlsRulesGroup.removeControl('arrValue');
      this.arrValueControl = null;
    }
  }

  private _loadData(): void {
    if (this.rule) {
      this._loadKeyControl(this.rule?.key);
      const attribute = this.ruleService.getAttributeEntity(this.keyControl);
      this._loadTypeControl();
      this._setOperatorOptions(attribute);
      this._loadOperatorControl(this.rule?.operator);
      this._setValueOptions(attribute);
      this.ruleService.loadValueControl(
        this.keyControl,
        this.valueControl,
        this.arrValueControl,
        this.rule?.value,
        this.readonly,
      );
    }
  }

  private _loadKeyControl(key: string): void {
    if (!key) {
      return;
    }
    const attr = _find(this.attributeOptions, {id: key});
    if (attr) {
      const option: MeAutoCompleteOption = {
        name: attr.name,
        id: attr.id,
        entity: attr.entity,
      };
      this.keyControl.setValue(option);
      this.onAttributeChanged();
    }
  }

  private _loadOperatorControl(id: string): void {
    if (!id) {
      return;
    }
    const obj = _find(this.operatorOptions, {id});
    if (obj) {
      this.operatorControl.setValue(obj.id);
      this.onOperatorChanged();
    }
  }

  private _loadTypeControl(): void {
    const type = this.keyControl?.value?.entity.type;
    this.typeControl.setValue(type);
  }

  private _defineControls(): void {
    this.keyControl = this.controlsRulesGroup.controls.key as FormControl;
    this.operatorControl = this.controlsRulesGroup.controls.operator as FormControl;
    this.typeControl = this.controlsRulesGroup.controls.type as FormControl;
  }

  private _setAttributeOptions(): void {
    this.attributeOptions = this.ruleService.getAttributeOptions(
      this.attributes,
      this._invalidAttributes,
    );
  }

  private _handleValueValidation(): void {
    const isNullOperator = this.ruleService.isNullOperator(this.operatorControl.value);
    if (isNullOperator) {
      this.rulesGroup.get('value').removeValidators(Validators.required);
    } else if (!this.rulesGroup.get('value').hasValidator(Validators.required)) {
      this.rulesGroup.get('value').addValidators(Validators.required);
    }
  }

  private _setValueComponentType(): void {
    const type = this.ruleService.getValueComponentType(this.keyControl, this.operatorControl);
    if (type === 'null') {
      this._removeValueControl();
      this._removeArrValueControl();
    } else if (type === 'list' || type === 'free-list') {
      this._removeValueControl();
      this._addArrValueControl();
    } else {
      this._removeArrValueControl();
      this._addValueControl();
    }
    this.valueComponentType = type;
  }

  private _getValueControlValidations(): Array<any> {
    return [
      Validators.required,
      (control: AbstractControl): ValidationErrors => {
        return this.ruleService.customValidatorValueControl(control);
      },
    ];
  }

  private _setDefaultOperator(): void {
    if (!this.keyControl.value) {
      this.operatorControl.setValue(null);
    }
    if (this.operatorOptions.length) {
      this.operatorControl.setValue(this.operatorOptions[0].id);
    }
  }

  private _setOperatorOptions(attr: QEAttribute): void {
    this.operatorOptions = this.ruleService.getOperatorOptions(attr);
    this.typeControl.setValue(attr?.columnType);
  }

  private _resetValueControls(): void {
    if (this.arrValueControl) {
      this.arrValueControl.setValue([]);
    }
    if (this.valueControl) {
      this.valueControl.setValue(null);
    }
  }

  private _setValueOptions(attr: QEAttribute): void {
    if (attr?.columnType === 'boolean') {
      this.valueOptions = booleanOptions;
    } else {
      this.valueOptions = attr?.values ?? [];
    }
  }

  private _onIsTouched(touched: boolean): void {
    if (touched) {
      this.controlsRulesGroup?.markAllAsTouched();
    }
  }
}
