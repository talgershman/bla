import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioChange, MatRadioModule} from '@angular/material/radio';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import copy from 'copy-to-clipboard';
import {DatasetService} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {Dataset, SubQuery} from 'deep-ui/shared/models';
import {BehaviorSubject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

export enum JumpFileDialogOptionTypes {
  MUlTI_FIELDS = 'multiple_fields',
  Simple = 'simple',
}

@Component({
  selector: 'de-jump-file-dialog',
  templateUrl: './jump-file-dialog.component.html',
  styleUrls: ['./jump-file-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatRadioModule,
    ReactiveFormsModule,
    FormsModule,
    NgTemplateOutlet,
    MeInputComponent,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatDialogModule,
    MeTooltipDirective,
    MatIconModule,
    MatFormFieldModule,
    AsyncPipe,
  ],
})
export class JumpFileDialogComponent implements OnInit {
  @ViewChild('simpleJumpTmpl', {static: true}) simpleJumpTmpl: TemplateRef<any>;

  @ViewChild('multiFieldsJumpFileTmpl', {static: true}) multiFieldsJumpFileTmpl: TemplateRef<any>;

  @Input()
  dataset: Dataset;

  @Output()
  closeDialog = new EventEmitter<void>();

  selectedTmpl: TemplateRef<any>;

  JumpFileDialogOptionTypes = JumpFileDialogOptionTypes;

  multiFieldsJumpFileDocUrl = environment.multiFieldsJumpFileDocUrl;

  isJumpFileEnabled: boolean;

  selectOption: JumpFileDialogOptionTypes = JumpFileDialogOptionTypes.Simple;

  gapControl = new FormControl(1, Validators.min(1));

  private loadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  private datasetService = inject(DatasetService);
  private snackbar = inject(MeSnackbarService);

  ngOnInit(): void {
    this.selectedTmpl = this.simpleJumpTmpl;
    this.isJumpFileEnabled = this._checkIfJumpFileAllowed();
  }

  async onSubmit(): Promise<void> {
    if (this.gapControl.valid) {
      this.loadingSubscription.next(true);
      await this.datasetService.downloadJumpFile(this.dataset, this.gapControl.value);
      this.loadingSubscription.next(false);
      this.closeDialog.next();
    }
  }

  onOptionSelected(option: MatRadioChange): void {
    const selectOption = option.value as JumpFileDialogOptionTypes;
    switch (selectOption) {
      case JumpFileDialogOptionTypes.MUlTI_FIELDS: {
        this.selectedTmpl = this.multiFieldsJumpFileTmpl;
        break;
      }
      case JumpFileDialogOptionTypes.Simple: {
        this.selectedTmpl = this.simpleJumpTmpl;
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = selectOption;
        throw new Error(`Unhandled onOptionSelected case: ${exhaustiveCheck}`);
      }
    }
  }

  copyToClipboard(value: string): void {
    copy(value);
    this.snackbar.onCopyToClipboard();
  }

  private _checkIfJumpFileAllowed(): boolean {
    let isValid = false;
    for (const query of this.dataset?.queryJson || []) {
      const queryObj = query as SubQuery;
      if (queryObj?.query?.columns?.length) {
        isValid = true;
        break;
      }
    }
    return isValid;
  }
}
