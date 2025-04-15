import {ChangeDetectorRef, inject, Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup} from '@angular/forms';
import {parseInteger, removeUnmatchedKeys} from '@mobileye/material/src/lib/utils';
import {OnPremService} from 'deep-ui/shared/core';
import {EtlServiceTypes} from 'deep-ui/shared/models';
import {DeepFormValidations} from 'deep-ui/shared/validators';
import _filter from 'lodash-es/filter';
import _mergeWith from 'lodash-es/mergeWith';
import _startCase from 'lodash-es/startCase';

import {
  ServiceFormGroup,
  ServiceFormValue,
  ServicesDagObject,
  UploadFilesFormGroup,
} from './entites';

@Injectable()
export class OverrideEtlParamsControlService {
  private onPremService = inject(OnPremService);

  addControls(
    servicesDag: any,
    services: ServicesDagObject,
    servicesController: FormArray,
    initialOverrideParams: any,
    cd: ChangeDetectorRef,
  ): void {
    let nextServiceIdStr = servicesDag.root;
    while (nextServiceIdStr) {
      // only services ids
      // eslint-disable-next-line
      const serviceId = parseInt(nextServiceIdStr);
      if (!isNaN(serviceId)) {
        const formGroupItem = this._addServiceFormGroupItem(
          nextServiceIdStr,
          services[nextServiceIdStr].type as EtlServiceTypes,
          initialOverrideParams,
          services,
          cd,
        );
        servicesController.push(formGroupItem);
      }
      nextServiceIdStr = servicesDag[nextServiceIdStr];
    }
  }

  generateUploadFilesFormControl(
    pathValue: string | {path: string; type: string},
    cd: ChangeDetectorRef,
  ): FormGroup<UploadFilesFormGroup> {
    let type: string = null;
    let path: string;
    //if reTrigger than this is an object
    if (pathValue?.['type']) {
      type = pathValue['type'];
    }
    if (pathValue?.['path']) {
      path = pathValue['path'];
    } else {
      path = pathValue as string;
    }
    const group = new FormGroup({
      type: new FormControl<string>(type),
      path: new FormControl<string>(path, {
        asyncValidators: DeepFormValidations.checkInFileSystemAsWarning(
          this.onPremService,
          'path',
          cd,
          this._updateOnValidFileSystemPath.bind(this),
        ),
      }),
    });

    if (pathValue) {
      group.controls.path.markAsTouched();
    }

    return group;
  }

  serializeControlValue(servicesValue: Array<ServiceFormValue>): any {
    const result = {
      params: {},
    };
    for (const value of servicesValue) {
      const filteredUploadFiles = _filter(
        value.uploadFiles,
        (item: {type: string; path: string}) => item.type && item.path,
      );
      const type = value.type;
      result.params[type] = {};
      result.params[type].id = parseInteger(value.id);
      result.params[type].configuration = {
        ...(value.params || {}),
        ...(value?.uploadFiles !== undefined ? {upload_files: filteredUploadFiles} : {}),
      };
    }
    return result;
  }

  private _updateOnValidFileSystemPath(control: AbstractControl, type: 'file' | 'folder'): void {
    if (!control?.parent) {
      return;
    }
    const formGroup = control.parent as FormGroup;
    const typeControl = formGroup.controls.type as FormControl<string>;
    typeControl.setValue(type ?? 'file');
  }

  private _getParamsUploadFiles(paramsValue: any): any {
    return paramsValue?.upload_files || paramsValue?.uploadFiles || null;
  }

  private _getParamsValue(
    serviceId: string,
    type: EtlServiceTypes,
    initialOverrideParams: any,
    services: ServicesDagObject,
  ): any {
    if (type === EtlServiceTypes.PerfectTransform) {
      return {
        ...services[serviceId].configuration?.['params'],
      };
    }
    return {
      ...(initialOverrideParams?.params?.[type]?.configuration ||
        services[serviceId].configuration),
    };
  }

  private _addServiceFormGroupItem(
    serviceId: string,
    serviceType: EtlServiceTypes,
    initialOverrideParams: any,
    services: ServicesDagObject,
    cd: ChangeDetectorRef,
  ): FormGroup<ServiceFormGroup> {
    const paramsValue = this._getParamsValue(
      serviceId,
      serviceType,
      initialOverrideParams,
      services,
    );
    const uploadFileControls = this._getUploadFileInitialValue(paramsValue, cd);

    const formGroup = new FormGroup<ServiceFormGroup>({
      // todo: remove when backend change 'probe' to 'ETL'
      title: new FormControl<string>(_startCase(serviceType?.replace('probe', 'ETL'))),
      type: new FormControl<string>(serviceType),
      id: new FormControl<string>(serviceId),
      params: new FormControl<any>(paramsValue),
      uploadFiles: new FormArray<FormGroup<UploadFilesFormGroup>>(uploadFileControls),
    });
    if (this._getParamsUploadFiles(paramsValue)) {
      delete paramsValue.uploadFiles;
      delete paramsValue.upload_files;
    } else {
      formGroup.removeControl('uploadFiles');
    }
    return formGroup;
  }

  private _getUploadFileInitialValue(paramsValue: any, cd: ChangeDetectorRef): Array<FormGroup> {
    const uploadFilesValue = this._getParamsUploadFiles(paramsValue);
    if (!uploadFilesValue) {
      return [];
    } else if (uploadFilesValue.length === 0) {
      //add first empty value
      uploadFilesValue.push('');
    }
    const result = [];
    for (const path of uploadFilesValue) {
      const control = this.generateUploadFilesFormControl(path, cd);
      result.push(control);
    }
    return result;
  }

  getFixAttributes(serviceParamsControlValue: any, initialServiceValue: any): any {
    delete initialServiceValue?.upload_files;

    const removeKeysServiceParams = removeUnmatchedKeys(
      serviceParamsControlValue,
      initialServiceValue,
      true,
    );

    return _mergeWith(
      {},
      initialServiceValue,
      removeKeysServiceParams,
      (objValue: any, srcValue: any) => {
        if (Array.isArray(srcValue) && Array.isArray(objValue)) {
          return srcValue;
        }
        if (Array.isArray(srcValue)) {
          return srcValue;
        }
        if (Array.isArray(objValue)) {
          return objValue;
        }
        return undefined;
      },
    );
  }
}
