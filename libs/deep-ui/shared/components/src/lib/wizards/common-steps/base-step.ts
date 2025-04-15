import {Directive, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {FormControlStatus} from '@angular/forms';
import {Params} from '@angular/router';
import {UntilDestroy} from '@ngneat/until-destroy';
import {JobFormBuilderService} from 'deep-ui/shared/core';
import _isNil from 'lodash-es/isNil';
import _omitBy from 'lodash-es/omitBy';

@UntilDestroy()
@Directive()
export abstract class BaseStepDirective implements OnInit {
  @Input()
  initialSelectionId: string | number;

  @Output()
  moveToNextStep = new EventEmitter<void>();

  @Output()
  formState = new EventEmitter<FormControlStatus>();

  @Input()
  tableComponentId: string;

  @Input()
  stepShown: boolean;

  @Input()
  wasShown: boolean;

  isReTriggerFlow: boolean;

  protected jobFormBuilderService = inject(JobFormBuilderService);

  ngOnInit(): void {
    this.isReTriggerFlow = !!this.jobFormBuilderService.mainJob;
  }

  getInitialTableFilters(id: string | number, initialFiltersValue?: Params): Params {
    const idFilter = _isNil(id) ? undefined : {id};
    if (!initialFiltersValue && !idFilter) {
      return null;
    }
    return {
      ..._omitBy(initialFiltersValue || {}, _isNil),
      ...(idFilter || {}),
    } as Params;
  }
}
