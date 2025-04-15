import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControlStatus,
  NgControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {MeControlErrorMsgComponent} from '@mobileye/material/src/lib/components/form/control-error-msg';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {isJson} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {JSONPath} from '@schematics/angular/utility/json-file';
import {isArray} from 'lodash-es';
import _isEqual from 'lodash-es/isEqual';
import _isNil from 'lodash-es/isNil';
import _isString from 'lodash-es/isString';
import {distinctUntilChanged} from 'rxjs/operators';
import {Content, createJSONEditor, JSONContent, JsonEditor, TextContent} from 'vanilla-jsoneditor';

// wrapper for the vanilla version of: https://github.com/josdejong/svelte-jsoneditor
@UntilDestroy()
@Component({
  selector: 'me-json-editor',
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HintIconComponent, MeControlErrorMsgComponent],
})
export class MeJsonEditorComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  @Input()
  title: string;

  @Input()
  infoTooltip: string;

  @Input()
  overrideOptions = {};

  @Input()
  isTouched: boolean;

  @Input()
  errors: ValidationErrors;

  @Input()
  initialUpdate = false;

  @Input()
  showEvenInError = false;

  @ViewChild('jsonEditorElement', {static: false, read: ElementRef})
  jsonEditorElement: ElementRef;

  ngControl = inject(NgControl, {optional: true, self: true})!;
  private cd = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  _value: any;

  get value(): any {
    if (this.ngControl?.valid || this.ngControl?.pending || this.showEvenInError) {
      return this._value;
    }
    return null;
  }

  private prevValue;
  private _editor: JsonEditor;
  private props: Record<string, any>;

  constructor() {
    // Replace the provider from above with this.
    if (this.ngControl != null) {
      // Setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }
  }

  // eslint-disable-next-line
  onChange = (value: any) => {};

  // eslint-disable-next-line
  onTouched = () => {};

  ngOnInit(): void {
    if (this.ngControl?.valueChanges) {
      this.ngControl?.valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
        this._value = value;
        this._writeValue();
      });
      this.ngControl?.statusChanges
        .pipe(distinctUntilChanged(), untilDestroyed(this))
        .subscribe((value: FormControlStatus) => {
          if (value === 'INVALID') {
            this.cd.markForCheck();
          }
        });
    }
  }

  ngAfterViewInit(): void {
    this._setup();
    if (this.ngControl?.control) {
      this._composeDefaultValidators();
    }

    if (this.initialUpdate) {
      setTimeout(() => {
        this.onChange(this._value);
      });
    }
  }

  syntaxValidator(control: AbstractControl): ValidationErrors {
    const value = control.value;
    try {
      // this._editor.validate will throw an error if the inner reference is not bind to the element yet
      // in the next rendering cycle it will validate without an error
      const currentErrors = value ? this._editor.validate() : null;
      if (this.props?.mode !== 'tree' && value?.length && currentErrors) {
        return {syntaxErrors: ''};
      }
      //eslint-disable-next-line
    } catch (_) {}

    return null;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(obj: any): void {
    this._value = obj;
    if (this._editor) {
      this._writeValue();
    }
  }

  _setup(): void {
    if (!this._editor) {
      const options: any = {
        ...{
          mode: 'text',
          enableTransform: false,
          indentation: 4,
          onBlur: this._onChangeJSON.bind(this),
          askToFormat: true,
        },
        ...this.overrideOptions,
      };
      if (options.readOnly && !this.overrideOptions['mode']) {
        options.mode = 'tree';
      }
      const shouldExpand = options.expand;
      if (options.expand) {
        // shouldExpand = options.expand;
        // delete because it throws a warning next line, that 'expand' is attribute is not supported in JSONEditor
        delete options.expand;
      }
      const content = {};
      if (isJson(this._value) && !_isNil(this._value)) {
        (content as JSONContent).json = this._value;
      } else {
        (content as TextContent).text = this._value || '';
      }
      this.props = {
        ...options,
        ...{expand: false},
        content,
      };
      this.ngZone.runOutsideAngular(() => {
        this._editor = createJSONEditor({
          target: this.jsonEditorElement.nativeElement,
          props: this.props,
        });
      });
      if (this.overrideOptions['meExpandLevel']) {
        setTimeout(() => this.expandByLevel(this.overrideOptions['meExpandLevel']));
      } else if (shouldExpand && options.mode === 'tree') {
        setTimeout(() => this.expandAll());
      } else if (options.mode === 'tree') {
        setTimeout(() => this.expandOneLevel());
      }
    }
  }

  _writeValue(): void {
    if (!this.prevValue) {
      this.prevValue = this._value;
    }
    if (!_isNil(this._value) && isJson(this._value)) {
      this._editor.update({
        json: this._value,
      });
    } else if (this._value === null && !_isString(this._value)) {
      this._editor.update({
        text: '',
      });
    } else if (this._value === '') {
      this._value = null;
      this.prevValue = this._value;
    }
  }

  _onChangeJSON(): void {
    this.onTouched();
    if (this.showEvenInError) {
      return;
    }
    const content: Content = this._editor.get();
    if (this.props.mode === 'tree') {
      const jsonContent: JSONContent = content as JSONContent;
      if (!jsonContent.json) {
        this.onChange(null);
      } else if (_isString(jsonContent.json)) {
        this.onChange('');
      } else {
        this._updateJson(jsonContent.json);
      }
    } else if (content['text'] !== undefined) {
      const textContent: TextContent = content as TextContent;
      const text = textContent.text;
      if (isJson(text)) {
        const value = JSON.parse(text);
        const jsonValue = !isArray(value) && Object.keys(value).length === 0 ? {} : value;
        this._updateJson(jsonValue);
      } else {
        if (text?.length) {
          this.onChange(text);
          this.prevValue = text;
        } else {
          this.onChange(null);
        }
      }
    }
  }

  async expandAll(): Promise<void> {
    if (this._editor.expand) {
      // in mode "text" an error will be thrown and catched by the editor
      await this._editor.expand([], (_) => true);
    }
  }

  expandOneLevel(): void {
    if (this._editor.expand) {
      this._editor.collapse([], true);
      setTimeout(() => {
        this._editor?.expand([], (relativePath: JSONPath) => relativePath.length < 1); // Expand to 1 level only
      }, 0);
    }
  }

  expandByLevel(level: number): void {
    if (this._editor.expand) {
      this._editor.collapse([], true);
      setTimeout(() => {
        this._editor?.expand([], (relativePath: JSONPath) => relativePath.length < level);
      }, 0);
    }
  }

  async repair(): Promise<void> {
    if (this._editor.acceptAutoRepair) {
      await this._editor.acceptAutoRepair();
    }
  }

  private _updateJson(jsonValue: any): void {
    if (jsonValue) {
      if (_isString(this.prevValue) || !_isEqual(this.prevValue, jsonValue)) {
        const updatedJsonValue = isArray(jsonValue) ? [...jsonValue] : {...jsonValue};
        this.onChange(updatedJsonValue);
        this.onTouched();
      }
      this.prevValue = jsonValue;
    }
  }

  private _composeDefaultValidators(): void {
    const existingValidator = this.ngControl.control.validator;
    if (!existingValidator) {
      this.ngControl.control.setValidators(this.syntaxValidator.bind(this));
    } else {
      this.ngControl.control.setValidators(
        Validators.compose([existingValidator, this.syntaxValidator.bind(this)]),
      );
    }
    this.ngControl.control.updateValueAndValidity();
  }
}
