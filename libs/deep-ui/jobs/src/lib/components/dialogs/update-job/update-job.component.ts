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
import {FormBuilder, FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {getDiffKeys} from '@mobileye/material/src/lib/utils';
import {EtlJobService} from 'deep-ui/shared/core';
import {EtlJob} from 'deep-ui/shared/models';
import {BehaviorSubject} from 'rxjs';
import {debounceTime, finalize} from 'rxjs/operators';

@Component({
  selector: 'de-update-job',
  templateUrl: './update-job.component.html',
  styleUrls: ['./update-job.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    MeFormControlChipsFieldComponent,
    MatProgressSpinnerModule,
    MatButtonModule,
    AsyncPipe,
  ],
})
export class UpdateJobComponent implements OnInit {
  @Input()
  etlJob: EtlJob;

  @Output()
  closeDialog = new EventEmitter<void>();

  private etlJobService = inject(EtlJobService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    tags: new FormControl([]),
    markAsFailed: new FormControl<boolean>(false),
  });

  private initialFormValue: any;

  private loadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  ngOnInit(): void {
    if (this.etlJob?.status !== 'done') {
      this.form.controls.markAsFailed.disable();
    }

    this.form.controls.tags.setValue(this.etlJob?.tags || []);
    this.initialFormValue = this.form.value;
  }

  onSaveClicked(): void {
    const modelValues = this.form.value;
    const dirtyKeys = getDiffKeys(this.initialFormValue, modelValues);
    const dirtyValues = this._getDirtyControls(dirtyKeys);
    if (!dirtyValues) {
      this.closeDialog.emit();
      return;
    }
    const requestBody: any = {
      ...dirtyValues,
      ...(dirtyValues.markAsFailed && {status: 'failed'}),
    };
    delete requestBody.markAsFailed;

    this.loadingSubscription.next(true);
    this.etlJobService
      .updateJob(this.etlJob.jobUuid, requestBody)
      .pipe(finalize(() => this.loadingSubscription.next(false)))
      .subscribe(() => this.closeDialog.emit());
  }

  private _getDirtyControls(dirtyKeys: string[]): Partial<any> {
    const dirtyValues = {};
    for (const key of dirtyKeys) {
      dirtyValues[key] = this.form.get(key).value;
    }
    return Object.keys(dirtyValues).length ? dirtyValues : null;
  }
}
