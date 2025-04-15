import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  TemplateRef,
} from '@angular/core';
import {
  FormControl,
  FormControlStatus,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {BaseFormDirective} from 'deep-ui/shared/components/src/lib/forms';
import {
  Datasource,
  ETL,
  EtlServiceName,
  EtlServiceTypes,
  EtlTypeEnum,
  SdkStatus,
} from 'deep-ui/shared/models';
import {forceErrorMsgKey, hintKey, warningKey} from 'deep-ui/shared/validators';
import _remove from 'lodash-es/remove';
import {Observable, Subject} from 'rxjs';
import {filter, first, startWith, switchMap} from 'rxjs/operators';

import {EtlDiagramNode} from './etl-form-base.service';

@UntilDestroy()
@Directive()
export class EtlFormBaseDirective extends BaseFormDirective implements OnInit, AfterViewInit {
  @Input()
  etl: ETL;

  @Input()
  type: EtlTypeEnum;

  @Input()
  serviceNames: Array<EtlServiceName>;

  @Input()
  showCreateButton: boolean;

  @Input()
  showIncrementMajor: boolean;

  @Output()
  fromValueChanged = new EventEmitter<{
    etl: ETL;
    dataSources?: Array<Datasource>;
    budgetGroup?: string;
  }>();

  @Output()
  backButtonClicked = new EventEmitter();

  protected cd = inject(ChangeDetectorRef);

  EtlServiceTypes = EtlServiceTypes;

  etlForm: FormGroup;

  tagsControl: FormControl<Array<string>>;

  nodes: Array<EtlDiagramNode>;

  selectedNode: EtlDiagramNode;

  submitButtonTooltip: string;

  incrementMajorControl: FormControl<boolean>;

  selectNodeTemplate: TemplateRef<any>;

  isSubmitted = false;

  isFormValid = new Subject<void>();

  EtlTypeEnum = EtlTypeEnum;

  INCREMENT_MAJOR_TOOLTIP =
    'When checked, will increment the major (major.minor.micro) in your ETL version';

  initialFormData: any = {};

  ngOnInit(): void {
    super.ngOnInit();
    this.incrementMajorControl = new FormControl<boolean>(false);
    this.submitButtonTooltip = this.getSubmitTooltip();
  }

  // eslint-disable-next-line
  private isFormValid$ = this.isFormValid
    .asObservable()
    .pipe(switchMap(this._isFormValid.bind(this)), untilDestroyed(this))
    .subscribe((status: string) => {
      if (status === 'VALID') {
        this.onFormValid();
      }
    });

  ngAfterViewInit(): void {
    if (globalThis.jasmine) {
      setTimeout(() => {
        this._selectFirstNode();
      });
    } else {
      this._selectFirstNode();
    }
  }

  private _selectFirstNode(): void {
    if (this.nodes?.length) {
      this.selectedNode = this.nodes[0];
    }
  }

  getTeamProp(): string {
    return 'team';
  }
  getEntityType(): string {
    return 'etl';
  }

  onBackClicked(): void {
    this.backButtonClicked.emit();
  }

  copyCmdToClipboard(value: string): void {
    copy(value);
  }

  onNodeClicked(node: EtlDiagramNode, container: HTMLDivElement): void {
    if (this.isSubmitted) {
      setTimeout(() => {
        this.onTriggerSubmitForNestedForms();
      });
    }
    this.selectedNode = node;
    this.selectNodeTemplate = this._getNodeForm();
    if (container) {
      // eslint-disable-next-line
      container.scrollTop = 0;
    }
  }

  onTriggerSubmitForNestedForms(): void {}

  onDeleteNode(formGroupName: 'probeLogicForm' | 'logicForm', nodeId: string): void {
    _remove(this.nodes, (currentNode: EtlDiagramNode) => currentNode.id === nodeId);
    if (this.selectedNode.id === nodeId) {
      this.selectedNode = this.nodes[0];
      this.selectNodeTemplate = this._getNodeForm();
      this.cd.detectChanges();
    }
  }

  deprecatedSdkVersion(sdkStatus: string, sdkVersion: string): ValidatorFn {
    return (formGroup: FormGroup): ValidationErrors => {
      const errorMsg = this._deprecatedSdkMessage(formGroup, sdkStatus);
      const control = formGroup.get(sdkVersion);
      if (control) {
        if (errorMsg) {
          control[forceErrorMsgKey] = errorMsg;
        } else {
          control[forceErrorMsgKey] = null;
        }
      }
      return errorMsg ? {sdkDeprecated: errorMsg} : null;
    };
  }

  deprecationWarningSdkVersion(sdkStatus: string, sdkVersion: string): ValidatorFn {
    return (formGroup: FormGroup): ValidationErrors => {
      const sdkVersionControl = formGroup.get(sdkVersion);
      if (sdkVersionControl) {
        const deprecationWarningMsg = this._deprecationWarningSdkMessage(formGroup, sdkStatus);
        sdkVersionControl[warningKey] = deprecationWarningMsg;
      }
      return null;
    };
  }

  warningSdkVersion(sdkStatus: string, sdkVersion: string): ValidatorFn {
    return (formGroup: FormGroup): ValidationErrors => {
      const sdkVersionControl = formGroup.get(sdkVersion);
      if (sdkVersionControl) {
        const warningMsg = this._warningSdkMessage(formGroup, sdkStatus);
        sdkVersionControl[hintKey] = warningMsg;
      }
      return null;
    };
  }

  getNextFormValue(currentValue: ETL, diffKeys): any {
    // we always make a request in case this is checked, even if the form didn't change
    if (this.incrementMajorControl.value) {
      return {
        ...currentValue,
        increaseMajorVersion: true,
      };
    }
    // check if the form is dirty
    return Object.keys(diffKeys).length ? currentValue : null;
  }
  getSubmitTooltip(): string {
    if (
      this.formMode === 'edit' &&
      !this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(this.etl, this.getTeamProp())
    ) {
      return `You are not allowed to edit the ETL, only a member of the team: ${this.etl.team} can edit this.`;
    }
    return '';
  }

  protected onFormValid(): void {
    throw new Error('onFormValid not implemented');
  }

  private _getNodeForm(): TemplateRef<any> {
    const key = this.selectedNode.formTemplateKey;
    return this[key] as TemplateRef<any>;
  }

  private _isFormValid(): Observable<any> {
    return this.etlForm.statusChanges.pipe(
      startWith(this.etlForm.status),
      filter((value: FormControlStatus) => value !== 'PENDING'),
      first(),
    );
  }

  private _deprecatedSdkMessage(formGroup: FormGroup, sdkStatusKey: string): string {
    const formControl: FormControl = formGroup.get(sdkStatusKey) as FormControl;
    const sdkStatus: SdkStatus = formControl?.value;

    if (!sdkStatus) {
      return null;
    }
    if (sdkStatus.status === 'deprecated') {
      return sdkStatus.msg;
    }

    return null;
  }

  private _deprecationWarningSdkMessage(formGroup: FormGroup, sdkStatusKey: string): string {
    const sdkStatus: SdkStatus = formGroup.get(sdkStatusKey)?.value;

    if (!sdkStatus) {
      return null;
    }
    if (sdkStatus.status === 'deprecationWarning') {
      return sdkStatus.msg;
    }
    return null;
  }

  private _warningSdkMessage(formGroup: FormGroup, sdkStatusKey: string): string {
    const sdkStatus: SdkStatus = formGroup.get(sdkStatusKey)?.value;

    if (!sdkStatus) {
      return null;
    }
    if (sdkStatus.status === 'warning') {
      return sdkStatus.msg;
    }
    return null;
  }
}
