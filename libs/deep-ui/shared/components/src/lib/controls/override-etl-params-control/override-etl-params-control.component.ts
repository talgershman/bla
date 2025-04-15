import {
  ChangeDetectorRef,
  Component,
  computed,
  forwardRef,
  inject,
  Input,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormControlStatus,
  FormGroup,
  NG_ASYNC_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatError} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {warningKey} from 'deep-ui/shared/validators';
import _isEqual from 'lodash-es/isEqual';
import {OnChange} from 'property-watch-decorator';
import {Observable} from 'rxjs';
import {distinctUntilChanged, filter, first, map, startWith} from 'rxjs/operators';

import {ServiceFormGroup, ServicesDagObject, UploadFilesFormGroup} from './entites';
import {OverrideEtlParamsControlService} from './override-etl-params-control.service';

@UntilDestroy()
@Component({
  selector: 'de-override-etl-params-control',
  templateUrl: './override-etl-params-control.component.html',
  styleUrls: ['./override-etl-params-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OverrideEtlParamsControlComponent),
      multi: true,
    },
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: forwardRef(() => OverrideEtlParamsControlComponent),
      multi: true,
    },
    OverrideEtlParamsControlService,
  ],
  imports: [
    ReactiveFormsModule,
    MeJsonEditorComponent,
    MeControlListComponent,
    MeInputComponent,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatError,
    MatSlideToggle,
    HintIconComponent,
    MeTooltipDirective,
  ],
})
export class OverrideEtlParamsControlComponent
  implements OnInit, ControlValueAccessor, AsyncValidator
{
  @Input()
  services: ServicesDagObject;

  @OnChange<void>('_onServicesDagChanged')
  @Input()
  servicesDag: any;

  @Input()
  initialOverrideParams: any;

  defaultOverrideParams = input<any>();

  paramsToggleStateChanged = output<any>();

  errorMsg = signal<string>('');

  control: AbstractControl;

  // eslint-disable-next-line
  _onTouched = () => {};

  // eslint-disable-next-line
  _onChange = (value: any) => {};

  form = new FormGroup({
    servicesController: new FormArray([]),
  });

  warningKey = warningKey;

  private initTriggered: boolean;

  private _currentValue = signal<any>(null);

  private _disabled: boolean;

  private _touched: boolean;

  private overrideEtlParamsControlService = inject(OverrideEtlParamsControlService);

  private cd = inject(ChangeDetectorRef);

  get servicesArrayControls(): Array<FormGroup<ServiceFormGroup>> {
    return this.form.controls.servicesController?.controls as Array<FormGroup<ServiceFormGroup>>;
  }

  get value(): any {
    if (this.control?.valid || this.control?.pending) {
      return this._currentValue();
    }
    return null;
  }

  get disabled(): boolean {
    return this.control?.disabled;
  }

  defaultValueToggleState = computed(() => {
    const currentValue = this._currentValue()?.params;
    const defaultOverrideParams = this.defaultOverrideParams()?.params;
    if (!currentValue || !defaultOverrideParams) {
      return null;
    }

    const result = {};
    Object.keys(currentValue || {}).forEach((key) => {
      //ignore upload_files field
      const first = {
        ...currentValue[key]?.configuration,
        upload_files: null,
      };
      const second = {
        ...defaultOverrideParams[key]?.configuration,
        upload_files: null,
      };
      result[key] = _isEqual(first, second);
    });

    this.paramsToggleStateChanged.emit(result);
    return result;
  });

  ngOnInit(): void {
    this.initTriggered = true;
    this._onServicesDagChanged();
  }

  validate(
    control: AbstractControl,
  ): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    if (!this.control) {
      control.statusChanges.pipe(untilDestroyed(this)).subscribe((status) => {
        if (status !== 'PENDING') {
          this._setErrorMsg(control);
        }
      });
    }
    return this.form.controls.servicesController.statusChanges.pipe(
      startWith(this.form.controls.servicesController.status),
      filter((status) => status !== 'PENDING'),
      distinctUntilChanged(),
      map((status: FormControlStatus) => {
        return status === 'VALID' ? null : {innerError: ''};
      }),
      first(),
    );
  }

  uploadFilesArrayControls(
    service: FormGroup<ServiceFormGroup>,
  ): Array<FormGroup<UploadFilesFormGroup>> {
    return service.controls.uploadFiles.controls;
  }

  onDeleteUploadFile(uploadFileControl: FormArray, i: number): void {
    uploadFileControl.removeAt(i);
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  writeValue(obj: any): void {
    this._currentValue.set(obj);
  }

  addUploadFileControl(uploadFileControl: FormArray): void {
    const control = this.overrideEtlParamsControlService.generateUploadFilesFormControl(
      '',
      this.cd,
    );
    uploadFileControl.push(control);
    this.cd.detectChanges();
  }

  onUseDefaultDefinition(value: any, serviceParamsControl: FormControl): void {
    const initialServiceValue = this.defaultOverrideParams()?.params?.[value.type].configuration;
    delete initialServiceValue.upload_files;
    serviceParamsControl.setValue(initialServiceValue);
  }

  fixAttributes(value: any, serviceParamsControl: FormControl): void {
    const initialServiceValue = this.defaultOverrideParams()?.params?.[value.type].configuration;

    const fixedAttributes = this.overrideEtlParamsControlService.getFixAttributes(
      serviceParamsControl.value,
      initialServiceValue,
    );

    //reset to force update
    serviceParamsControl.setValue(null);
    setTimeout(() => {
      serviceParamsControl.setValue(fixedAttributes);
    });
  }

  private _setErrorMsg(control: AbstractControl): void {
    const controlErrorsKeysArr = Object.keys(control.errors || {});
    if (controlErrorsKeysArr.length) {
      this.errorMsg.set(control.errors[controlErrorsKeysArr[0]]);
    } else {
      this.errorMsg.set(null);
    }
  }

  private _onServicesDagChanged(): void {
    if (!this.initTriggered) {
      return;
    }
    this.form.controls.servicesController?.clear();
    this.form.controls.servicesController = new FormArray([]);
    if (!this.services || !this.servicesDag) {
      return;
    }
    this._generateDagControls();
    setTimeout(() => {
      const value = this.overrideEtlParamsControlService.serializeControlValue(
        this.form.controls.servicesController.value,
      );
      this._currentValue.set(value);
      this._onChange(this._currentValue());
    });
  }

  private _generateDagControls(): void {
    this.overrideEtlParamsControlService.addControls(
      this.servicesDag,
      this.services,
      this.form.controls.servicesController,
      this.initialOverrideParams,
      this.cd,
    );
    this._registerEvents();
  }

  private _registerEvents(): void {
    this.form.controls.servicesController.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        const newValue = this.overrideEtlParamsControlService.serializeControlValue(value);
        this._onTouched();
        if (!_isEqual(newValue, this._currentValue())) {
          this._currentValue.set({...newValue});
          this._onChange(this._currentValue());
          this.cd.detectChanges();
        }
      });
  }
}
