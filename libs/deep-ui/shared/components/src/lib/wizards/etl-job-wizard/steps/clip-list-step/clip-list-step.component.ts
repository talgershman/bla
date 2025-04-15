import {IsRowSelectable} from '@ag-grid-community/core';
import {ChangeDetectionStrategy, Component, Input, input, OnInit} from '@angular/core';
import {FormControl, FormControlStatus, FormGroup, Validators} from '@angular/forms';
import {Params} from '@angular/router';
import {MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SelectClipListComponent} from 'deep-ui/shared/components/src/lib/selection/select-clip-list';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {ClipList, EtlJobRunType} from 'deep-ui/shared/models';
import _isNil from 'lodash-es/isNil';
import _omitBy from 'lodash-es/omitBy';
import _startCase from 'lodash-es/startCase';
import {distinctUntilChanged, startWith} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-clip-list-step',
  templateUrl: './clip-list-step.component.html',
  styleUrls: ['./clip-list-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectClipListComponent],
})
export class ClipListStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  initialFiltersValue: any;

  @Input()
  enableMultiSelection: boolean;

  @Input()
  overrideDisplayColumns: Array<string> = [];

  @Input()
  runType: EtlJobRunType;

  ignoreRowRestrictionOfFilters = input<boolean>();

  clipListForm = new FormGroup({
    clipLists: new FormControl(null, Validators.required),
  });

  ngOnInit(): void {
    super.ngOnInit();
    this._setInitialSelectionId();
    this._registerEvents();
  }

  onClipListsChanged(clipLists: ClipList[]): void {
    this.clipListForm.controls.clipLists.setValue([...clipLists]);
  }

  isRowSelectable: IsRowSelectable = (rowNode: MeRowNode): boolean => {
    if (!this.ignoreRowRestrictionOfFilters()) {
      for (const key in this.initialFiltersValue || {}) {
        if (!rowNode.data.hasOwnProperty(key)) {
          continue;
        }
        if (rowNode.data[key] !== this.initialFiltersValue[key]) {
          rowNode.rowTooltip = `${_startCase(key)} is invalid`;
          return false;
        }
      }
    }

    return true;
  };

  getInitialTableFilters(id: string | number, initialFiltersValue?: Params): Params {
    const idFilter = _isNil(id) ? undefined : {id};
    if (!initialFiltersValue && !idFilter) {
      return null;
    } else if (idFilter) {
      return {
        ...(idFilter || {}),
      } as Params;
    }
    return {
      ..._omitBy(initialFiltersValue || {}, _isNil),
      ...(idFilter || {}),
    } as Params;
  }

  private _registerEvents(): void {
    this.clipListForm.statusChanges
      .pipe(
        startWith<FormControlStatus>(this.clipListForm.status),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((value: FormControlStatus) => this.formState.emit(value));
  }

  private _setInitialSelectionId(): void {
    this.initialSelectionId = this.jobFormBuilderService.getValue('clip_list_id');
  }
}
