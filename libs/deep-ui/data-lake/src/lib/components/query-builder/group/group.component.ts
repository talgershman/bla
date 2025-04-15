import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  input,
  OnInit,
  Output,
} from '@angular/core';
import {FormArray, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {QEAggregation, QEAttribute, QEQueryConditions} from 'deep-ui/shared/models';
import _some from 'lodash-es/some';

import {AggregationComponent} from '../aggregation/aggregation.component';
import {RuleComponent} from '../rule/rule.component';

@Component({
  selector: 'de-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AggregationComponent, MatButtonModule, MatIconModule, RuleComponent],
})
export class GroupComponent implements OnInit {
  @Input()
  showCloseButton: boolean;

  @Input()
  groupIndex: number;

  @Input()
  allowAggregation: boolean;

  @Input()
  attributes: Array<QEAttribute> = [];

  @Input()
  conditionsForm: FormGroup<any>;

  @Input()
  aggregationForm: FormGroup<any>;

  @Input()
  groupTitle: string;

  @Input()
  queryConditions: QEQueryConditions;

  @Input()
  aggregationConditions: QEAggregation;

  @Input()
  isTouched: boolean;

  @Input()
  readonly: boolean;

  createEmptyRow = input(false);

  @Output()
  deleteGroup = new EventEmitter<void>();

  @Output()
  clearConditions = new EventEmitter<void>();

  viewState = computed(() => {
    return {
      createEmptyRow: this.createEmptyRow(),
      derivedLogic: computed(() => {
        if (this.createEmptyRow() && this.rulesControl.length === 0) {
          this.addEmptyRule();
        }
        return null;
      }),
    };
  });

  showIcons: boolean;

  conditionControl: FormControl<any>;

  rulesControl: FormArray<any>;

  rulesTypes: Array<string> = [];

  ngOnInit(): void {
    this._initForm();
    this._defineControls();
    this._loadData();
  }

  addSubGroup(): void {
    this.rulesControl.push(new FormGroup({}));
    this.rulesTypes.push('group');
  }

  addEmptyRule(): void {
    this.rulesControl.push(new FormGroup({}));
    this.rulesTypes.push('rule');
  }

  onDeleteRuleClicked(index: number): void {
    if (this.rulesControl.length === 1) {
      if (index !== 0) {
        this._removeGroup(index);
      }
    } else {
      this.rulesControl.removeAt(index);
      this.queryConditions?.rules?.splice(index, 1);
      this.rulesTypes.splice(index, 1);
    }
  }
  onDeleteGroupClicked(index: number): void {
    if (this.rulesControl.length > 1) {
      this.rulesControl.removeAt(index);
      this.queryConditions?.rules?.splice(index, 1);
      this.rulesTypes.splice(index, 1);
    }
  }

  removeAllConditions(): void {
    this.conditionControl.setValue('AND');
    this.rulesControl.clear();
    this.rulesTypes = [];
    this.clearConditions.emit();
  }

  private _loadData(): void {
    if (Object.keys(this.queryConditions || {}).length === 0) {
      this.addEmptyRule();
    } else {
      this.conditionControl.setValue(this.queryConditions.condition);
      this._updateRules();
    }
  }

  private _updateRules(): void {
    const rules = this.queryConditions?.rules || [];
    for (const rule of rules) {
      if ('condition' in rule) {
        this.addSubGroup();
      } else {
        this.addEmptyRule();
      }
    }
  }

  private _initForm(): void {
    this.conditionsForm.addControl(
      'condition',
      new FormControl<string>('AND', Validators.required),
    );
    this.conditionsForm.addControl(
      'rules',
      new FormArray([], {
        validators: [
          (form: FormArray): ValidationErrors => {
            const length = form.controls.length;
            if (!length) {
              return null;
            }
            const isInvalid = _some(form.controls, (group: FormGroup) => group.invalid);
            if (isInvalid) {
              return {error: true};
            }
            return null;
          },
        ],
      }),
    );
  }

  private _defineControls(): void {
    this.conditionControl = this.conditionsForm.controls.condition as FormControl;
    this.rulesControl = this.conditionsForm.controls.rules as FormArray;
  }

  private _removeGroup(index: number): void {
    this.deleteGroup.emit();
    this.rulesControl.removeAt(index);
    this.queryConditions?.rules?.splice(index, 1);
    this.rulesTypes.splice(index, 1);
  }
}
