import {FocusMonitor} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormControlStatus,
  FormGroupDirective,
  NgControl,
  NgForm,
} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import {MatFormFieldControl} from '@angular/material/form-field';
import {ERRORS_DICTIONARY} from '@mobileye/material/src/lib/common';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {once} from 'lodash-decorators/once';
import {Subject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

@UntilDestroy()
@Directive()
export abstract class MeBaseFormFieldControlDirective<T>
  implements ControlValueAccessor, MatFormFieldControl<T>, DoCheck, OnInit, AfterViewInit, OnDestroy
{
  static nextId = 0;

  @Input()
  title: string;

  @Input()
  infoTooltip: string;

  @Input()
  warning: string;

  @Input()
  hint: string;

  @Input()
  forceErrorMsg: string;

  @Input('aria-describedby')
  userAriaDescribedBy: string;

  @Output()
  blurTriggered = new EventEmitter<void>();

  @Output()
  focusTriggered = new EventEmitter<void>();

  @Output()
  pastedTriggered = new EventEmitter<ClipboardEvent>();

  public ngControl = inject(NgControl, {optional: true, self: true})!;
  private _focusMonitor = inject(FocusMonitor);
  private _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private cd = inject(ChangeDetectorRef);
  private errorsDictionary = inject(ERRORS_DICTIONARY);
  private parentForm = inject(NgForm, {optional: true})!;
  private parentFormGroup = inject(FormGroupDirective, {optional: true})!;

  innerController: FormControl<T>;
  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  viewInitTriggered = false;
  abstract controlType: string;
  abstract id: string;
  errorMsg: string;

  abstract getFocusHTMLElement(): HTMLElement;

  onChange = (_: any) => {};
  onTouched = () => {};

  get empty() {
    return !this.innerController.value;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input()
  updateOn: 'blur' | 'change';

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder: string;

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    if (this._disabled) {
      this.innerController.disable();
    } else {
      this.innerController.enable();
    }
    this.stateChanges.next();
  }
  private _disabled = false;

  @Input()
  get value(): T | null {
    if (this.innerController.valid) {
      return this.innerController.value;
    }
    return null;
  }
  set value(value: T | null) {
    if (value !== this.value) {
      this.innerController.setValue(value);
      this.stateChanges.next();
    }
  }

  @HostBinding('style.--width')
  @Input()
  width: string;

  errorState = false;

  customErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (): boolean => {
      return this.errorState;
    },
  };

  constructor() {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
    if (this.parentFormGroup) {
      this.parentFormGroup.ngSubmit.pipe(untilDestroyed(this)).subscribe(() => {
        this._markControlAsTouched();
        this.updateErrorState();
        this.cd.detectChanges();
      });
    }
    this.innerController = new FormControl<T>(null, {updateOn: 'change'});
  }

  ngDoCheck(): void {
    this.updateErrorState();
    if (
      this.ngControl &&
      this.ngControl.disabled !== null &&
      this.ngControl.disabled !== this.disabled
    ) {
      this.disabled = this.ngControl.disabled;
      this.stateChanges.next();
    }
  }

  getRawValue(): T | null {
    return this.innerController.getRawValue();
  }
  updateErrorState(): void {
    this.errorMsg = '';
    const oldState = this.errorState;
    if (this.ngControl?.status === 'PENDING') {
      if (oldState) {
        this.errorState = false;
        this.stateChanges.next();
      }
      return;
    }

    const parent = this.parentFormGroup || this.parentForm;
    const isSubmitted = parent?.submitted || false;
    const newState = this._calcErrorState(isSubmitted);

    if (newState) {
      this.errorMsg = this._getErrorMsg();
    }
    if (newState !== oldState) {
      this.errorState = newState;
      this.stateChanges.next();
    }
  }

  ngOnInit(): void {
    this._initControl();
    this._bindEvents();
  }

  ngAfterViewInit(): void {
    this.viewInitTriggered = true;
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }
  onContainerClick(): void {
    const focusHTMLElement = this.getFocusHTMLElement();
    this._focusMonitor.focusVia(focusHTMLElement, 'program');
  }

  onFocusIn(): void {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
    setTimeout(() => {
      this.focusTriggered.emit();
    });
  }

  onFocusOut(event: FocusEvent): void {
    if (!event || !this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
      this.focused = false;
      this._markControlAsTouched();
      this.stateChanges.next();
    }
    setTimeout(() => {
      this.blurTriggered.emit();
    });
  }

  setDescribedByIds(_: string[]): void {}

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @once()
  private _markControlAsTouched(): void {
    this.touched = true;
    this.innerController.markAllAsTouched();
    this.onTouched();
    this.stateChanges.next();
  }

  private _calcErrorState(isSubmitted: boolean): boolean {
    if (!this.ngControl) {
      return false;
    }
    if (this.forceErrorMsg) {
      return true;
    }
    return (
      (this.ngControl.invalid || this.innerController.invalid || false) &&
      (this.ngControl.dirty || this.touched || isSubmitted)
    );
  }

  private _getErrorMsg(): string {
    const controlErrors = this.ngControl?.errors;
    const errors = Object.keys(controlErrors || {});
    if (!errors.length) {
      return '';
    }
    const firstKey = errors[0];
    const getError = this.errorsDictionary[firstKey];
    if (getError) {
      const error = getError(controlErrors[firstKey]);
      if (typeof error === 'string') {
        return error as string;
      }
      return controlErrors[firstKey];
    }
    return controlErrors[firstKey];
  }

  private _bindEvents(): void {
    this.innerController.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((value) => {
        if (this.ngControl.value !== value) {
          this._markControlAsTouched();
          this.onChange(value);
        }
      });

    this.ngControl?.statusChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((value: FormControlStatus) => {
        if (value !== 'PENDING') {
          this.updateErrorState();
          this.cd.detectChanges();
        }
      });
  }

  private _initControl(): void {
    const value = this.innerController.value ?? null;
    const disabled = this.innerController.disabled || false;
    this.innerController = new FormControl<T>({value, disabled}, {updateOn: this.updateOn});
  }
}
