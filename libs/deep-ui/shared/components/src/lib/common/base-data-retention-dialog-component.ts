import {Directive, inject, Input, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {
  DataRetentionConfig,
  DataRetentionObj,
  ETLJobSnakeCase,
  PerfectTransformJobSnakeCase,
} from 'deep-ui/shared/models';
import _isNil from 'lodash-es/isNil';
import _omitBy from 'lodash-es/omitBy';
import {Observable} from 'rxjs';

import {DataRetentionRegisterEventsDirective} from './data-retention-dialog-register-events';

@Directive()
export abstract class BaseDataRetentionDialogComponent implements OnInit {
  @Input()
  job: Partial<ETLJobSnakeCase | PerfectTransformJobSnakeCase>;

  @Input()
  config: DataRetentionConfig;

  dataRetentionControl = new FormControl<any>(null);

  isLoading$: Observable<boolean>;

  currentDataRetention: DataRetentionObj;

  showDataRetentionControl: boolean;

  protected jobDataRetention: any;

  protected dialog = inject(MatDialog);
  private dataRetentionRegisterEvents = inject(DataRetentionRegisterEventsDirective);

  abstract submit(): void;

  ngOnInit(): void {
    this.isLoading$ = this.dataRetentionRegisterEvents.isLoading$;
    if (!this.job) {
      return;
    }
    //remove null values
    this.jobDataRetention = _omitBy(this.job?.data_retention, _isNil);
    this.currentDataRetention = {
      ...this.jobDataRetention,
    };
    this.showDataRetentionControl = Object.keys(this.currentDataRetention).length > 0;
  }
}
