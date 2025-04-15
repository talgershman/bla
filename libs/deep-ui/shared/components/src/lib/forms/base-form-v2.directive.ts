import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {FormBuilder, FormControl, FormControlStatus, FormGroup} from '@angular/forms';
import {getDiffKeys} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Store} from '@ngrx/store';
import {BaseTourHostComponent} from 'deep-ui/shared/components/src/lib/common';
import {AppState, DeepUtilService} from 'deep-ui/shared/core';
import _uniq from 'lodash-es/uniq';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {debounceTime, filter, first, startWith, switchMap, tap} from 'rxjs/operators';

@UntilDestroy()
@Directive()
export abstract class BaseFormDirectiveV2<T>
  extends BaseTourHostComponent
  implements OnInit, OnDestroy
{
  @Input({required: true})
  formMode: 'create' | 'edit' | 'override';

  @Input()
  entity: T;

  @Input()
  createButtonLabel;

  @Input()
  cancelButtonLabel;

  @Output()
  backButtonClicked = new EventEmitter<void>();

  @Output()
  fromValueChanged = new EventEmitter<Partial<T>>();

  loadingSubscription = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  isDestroyed = false;

  initialFormData: Partial<T>;

  deepTeamOptions: string[] = [];

  teamControl: FormControl;

  mainForm: FormGroup;

  submitButtonTooltip: string;

  prevTourFormValue: any;

  protected deepUtilService = inject(DeepUtilService);
  protected store = inject<Store<AppState>>(Store);
  protected cd = inject(ChangeDetectorRef);
  protected el = inject(ElementRef);
  protected fb = inject(FormBuilder);

  override ngOnInit(): void {
    super.ngOnInit();
    this._setDeepTeamOptions();
    this.initForm();
    this.submitButtonTooltip = this.getSubmitTooltip();
  }

  override async ngOnDestroy(): Promise<void> {
    await super.ngOnDestroy();
    this.isDestroyed = true;
  }

  async startTour(): Promise<void> {}

  getSubmitTooltip(): string {
    if (
      this.formMode === 'edit' &&
      !this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(this.entity, this.getTeamProp())
    ) {
      return `You are not allowed to edit this, only a member of the team: ${
        this.entity[this.getTeamProp()]
      } can delete this.`; // todo: change to 'team'
    }
    return '';
  }

  onBackClicked(): void {
    this.backButtonClicked.emit();
  }

  onSubmit(): void {
    this.getMainForm().markAllAsTouched();
    this.isFormValid.next();
  }

  abstract getEntityType(): string;

  abstract getTeamProp(): string;

  abstract getMainForm(): FormGroup;

  protected abstract deSerializeDataAndPatchForm(): void;

  protected abstract setFormValidations(): void;

  protected onFormValid(): void {
    let value;
    if (this.formMode === 'edit') {
      value = this._getDirtyFormValue(this.getMainForm());
    } else if (this.formMode === 'create') {
      value = this.getMainForm().value;
    }
    const nextValue = this.serializeData(value);
    this.fromValueChanged.emit(nextValue);
  }

  protected serializeData(formValue: any): any {
    return formValue;
  }

  protected getDefaultTeam(): string {
    if (this.deepTeamOptions?.length === 1) {
      return this.deepTeamOptions[0];
    }
    return '';
  }

  protected initForm(): void {
    this.setFormValidations();
    this.deSerializeDataAndPatchForm();
    this.initialFormData = this.getMainForm().getRawValue();
  }

  // eslint-disable-next-line
  private isFormValid = new Subject<void>();

  // eslint-disable-next-line
  private isFormValidObj = this.isFormValid
    .asObservable()
    .pipe(switchMap(this._isFormValid.bind(this)), untilDestroyed(this));

  // eslint-disable-next-line
  private isFormValid$ = this.isFormValidObj.subscribe((status: FormControlStatus) => {
    if (status === 'VALID') {
      this.onFormValid();
    }
  });

  private _isFormValid(): Observable<any> {
    if (this.getMainForm().valid) {
      return of('VALID');
    }
    return this.getMainForm().statusChanges.pipe(
      startWith(this.getMainForm().status),
      tap((value: FormControlStatus) => {
        if (value === 'INVALID') {
          this._focusToFirstError();
        }
      }),
      filter((value: FormControlStatus) => value !== 'PENDING'),
      first(),
    );
  }

  private _focusToFirstError(): void {
    const firstInvalidControl: HTMLElement =
      this.el.nativeElement.querySelector('.controls .ng-invalid');

    const scrollContainer: HTMLElement = this.el.nativeElement.querySelector('.controls');

    setTimeout(() => {
      if (this._elementHasScroll(scrollContainer)) {
        if (
          !this.isDestroyed &&
          firstInvalidControl.getBoundingClientRect().bottom > scrollContainer.clientHeight
        ) {
          scrollContainer.scroll({
            top: this._getTopOffset(firstInvalidControl),
            left: 0,
            behavior: 'smooth',
          });
        }
      }
    }, 250);
  }

  private _elementHasScroll(controlEl: HTMLElement): boolean {
    return controlEl.scrollHeight > controlEl.clientHeight;
  }

  private _getTopOffset(controlEl: HTMLElement): number {
    return controlEl?.getBoundingClientRect().top - 50;
  }

  private _setDeepTeamOptions(): void {
    const teams = this.deepUtilService.getCurrentUserTeams();
    if (this.formMode === 'create') {
      this.deepTeamOptions = teams;
      return;
    }
    const currentTeam = this.entity?.[this.getTeamProp()]
      ? this.entity?.[this.getTeamProp()]
      : null;
    this.deepTeamOptions = currentTeam ? _uniq([currentTeam].concat(teams)) : teams;
  }

  private _getDirtyFormValue(mainForm: FormGroup): T {
    let mainFormValue = mainForm.getRawValue();
    if (this.initialFormData) {
      const diffKeys = getDiffKeys(this.initialFormData, mainFormValue);
      mainFormValue = this._getDirtyControls(mainForm, diffKeys);
    }
    return mainFormValue;
  }

  private _getDirtyControls(datasetForm: FormGroup, dirtyKeys: string[]): Partial<T> {
    const dirtyValues = {};
    for (const key of dirtyKeys) {
      dirtyValues[key] = datasetForm.get(key).value;
    }
    return Object.keys(dirtyValues).length ? dirtyValues : null;
  }
}
