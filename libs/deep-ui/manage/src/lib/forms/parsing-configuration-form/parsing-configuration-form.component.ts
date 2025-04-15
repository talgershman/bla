import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewContainerRef,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {CustomTourStepDirective} from '@mobileye/material/src/lib/components/tour-step';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {BaseFormDirective} from 'deep-ui/shared/components/src/lib/forms';
import {
  PARSING_CONFIGURATION_CUSTOM_STEP_ID,
  PARSING_CONFIGURATION_FORM_TOUR_ID,
} from 'deep-ui/shared/configs';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {ParsingConfiguration} from 'deep-ui/shared/models';
import {DeepFormValidations} from 'deep-ui/shared/validators';
import {Observable, of, Subject} from 'rxjs';
import {filter, first, startWith, switchMap} from 'rxjs/operators';

import {
  jsonExample1,
  jsonExample2,
  jsonExample3,
  jsonExample4,
} from './parsing-configuration-form-entites';

@UntilDestroy()
@Component({
  selector: 'de-parsing-configuration-form',
  templateUrl: './parsing-configuration-form.component.html',
  styleUrls: ['./parsing-configuration-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MeInputComponent,
    MeSelectComponent,
    MeAutocompleteComponent,
    MeTextareaComponent,
    MeJsonEditorComponent,
    MeTooltipDirective,
    MatButtonModule,
    MatExpansionModule,
    CustomTourStepDirective,
  ],
})
export class ParsingConfigurationFormComponent extends BaseFormDirective implements OnInit {
  @Input()
  parsingConfiguration: ParsingConfiguration = {} as any;

  @Input()
  showCreateButton = true;

  @Output()
  fromValueChanged = new EventEmitter<ParsingConfiguration>();

  @Output()
  backButtonClicked = new EventEmitter();

  public viewContainerRef = inject(ViewContainerRef);
  private parsingConfigurationService = inject(ParsingConfigurationService);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);

  parsingConfigurationForm = this.fb.group({
    name: [
      '',
      {
        nonNullable: true,
        validators: Validators.required,
      },
    ],
    folder: new FormControl<{id: string; name: string} | null>(null, {
      validators: Validators.required,
    }),
    group: [
      '',
      {
        nonNullable: true,
        validators: Validators.required,
      },
    ],
    config: [
      null,
      {
        validators: Validators.required,
        asyncValidators: DeepFormValidations.checkParsingConfigurationJsonConfig(
          this.parsingConfigurationService,
          this.cd,
        ),
      },
    ],
    description: ['', {nonNullable: true}],
  });

  folderOptions: string[];

  jsonExampleControl1: FormControl = new FormControl<any>(jsonExample1);
  jsonExampleControl2: FormControl = new FormControl<any>(jsonExample2);
  jsonExampleControl3: FormControl = new FormControl<any>(jsonExample3);
  jsonExampleControl4: FormControl = new FormControl<any>(jsonExample4);

  readonly PARSING_CONFIGURATION_FORM_TOUR_ID = PARSING_CONFIGURATION_FORM_TOUR_ID;
  readonly PARSING_CONFIGURATION_CUSTOM_STEP_ID = PARSING_CONFIGURATION_CUSTOM_STEP_ID;

  private isFormValid = new Subject<void>();

  // eslint-disable-next-line
  private isFormValid$ = this.isFormValid
    .asObservable()
    .pipe(switchMap(this._isFormValid.bind(this)), untilDestroyed(this))
    .subscribe((status: string) => {
      if (status === 'VALID') {
        this._onFormValid();
      }
    });

  ngOnInit(): void {
    super.ngOnInit();
    this._initForm();
    this._getFolderOptions();
  }

  async startTour(): Promise<void> {
    await this.tourService.startTour(PARSING_CONFIGURATION_FORM_TOUR_ID);
    this.tourService
      .getOnTourOpenedObs()
      .pipe(untilDestroyed(this))
      .subscribe(() => this._onTourOpened());
    this.tourService
      .getOnTourClosedObj()
      .pipe(untilDestroyed(this))
      .subscribe(() => this._onTourClosed());
  }

  getTeamProp(): string {
    return 'group';
  }

  getEntityType(): string {
    return 'parsingConfiguration';
  }

  onSubmit(): void {
    this.parsingConfigurationForm.markAllAsTouched();
    this.parsingConfigurationForm.controls.name.updateValueAndValidity();
    this.parsingConfigurationForm.controls.config.updateValueAndValidity();
    this.isFormValid.next();
  }

  onBackClicked(): void {
    this.backButtonClicked.emit();
  }

  private async _onTourOpened(): Promise<void> {
    this.prevTourFormValue = {
      ...this.parsingConfigurationForm.getRawValue(),
    };
    this.parsingConfigurationForm.reset();
    this.parsingConfigurationForm.markAsUntouched();
    this.cd.detectChanges();
  }

  private async _onTourClosed(): Promise<void> {
    //clear form before reset to previous state
    this.parsingConfigurationForm.reset();
    this.parsingConfigurationForm.patchValue(this.prevTourFormValue);
    this.parsingConfigurationForm.markAsUntouched();
    this.prevTourFormValue = null;
    this.cd.detectChanges();
  }

  private _initForm(): void {
    this._setFormValidations();
    this._initInitialFormState();
    this._deSerializeDataAndPatchForm();
  }

  private _setFormValidations(): void {
    this.parsingConfigurationForm.controls.name.addAsyncValidators(
      DeepFormValidations.checkParsingConfigurationName(
        this.parsingConfigurationService,
        this.parsingConfiguration?.id,
        this.cd,
      ),
    );
  }

  private _onFormValid(): void {
    const formValue = this.parsingConfigurationForm.value;
    const value = {
      ...formValue,
      folder: formValue.folder.id ? formValue.folder.id : formValue.folder,
    };
    this.fromValueChanged.emit(value as any);
    this.cd.detectChanges();
  }

  private _isFormValid(): Observable<any> {
    if (this.parsingConfigurationForm.valid) {
      return of('VALID');
    }
    return this.parsingConfigurationForm.statusChanges.pipe(
      startWith(this.parsingConfigurationForm.status),
      filter((value: FormControlStatus) => value !== 'PENDING'),
      first(),
    );
  }

  private _initInitialFormState(): void {
    const defaultGroup = this.getDefaultTeam();
    this.parsingConfigurationForm.controls.group.setValue(defaultGroup);
  }

  private _deSerializeDataAndPatchForm(): void {
    if (Object.keys(this.parsingConfiguration || {}).length) {
      const group = this.deepTeamOptions.includes(this.parsingConfiguration.group)
        ? this.parsingConfiguration.group
        : undefined;
      this.parsingConfigurationForm.patchValue({
        name:
          this.formMode === 'create'
            ? `${this.parsingConfiguration.name}${DUPLICATE_SUFFIX_STR}`
            : this.parsingConfiguration.name,
        folder: {
          id: this.parsingConfiguration.folder,
          name: this.parsingConfiguration.folder,
        },
        description: this.parsingConfiguration.description,
        group: group,
        config: this.parsingConfiguration.config,
      });
    }
  }

  private _getFolderOptions(): void {
    this.parsingConfigurationService
      .getLeanMulti()
      .pipe(untilDestroyed(this))
      .subscribe((response: Array<ParsingConfiguration>) => {
        if (response) {
          this.folderOptions = this.parsingConfigurationService.getFolders(response);
        }
      });
  }
}
