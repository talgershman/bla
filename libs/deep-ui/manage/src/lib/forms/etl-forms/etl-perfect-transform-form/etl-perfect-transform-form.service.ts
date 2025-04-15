import {Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MeAutoCompleteOption} from '@mobileye/material/src/lib/components/form/autocomplete';
import {ETL, EtlDagService, EtlServiceName, EtlServiceTypes} from 'deep-ui/shared/models';
import {warningKey} from 'deep-ui/shared/validators';

import {EtlDiagramNode, EtlFormBaseService} from '../etl-form-base.service';

@Injectable()
export class EtlPerfectTransformFormService extends EtlFormBaseService {
  getDiagramNodes(etlForm: FormGroup): Array<EtlDiagramNode> {
    return [
      {
        id: 'root',
        title: 'Root',
        formGroup: etlForm.get('rootForm'),
        formGroupName: 'rootForm',
        formTemplateKey: 'rootFormTemplate',
      },
      {
        id: 'perfectTransform',
        title: 'Perfect Transform',
        formGroup: etlForm.get('perfectTransformForm'),
        formGroupName: 'perfectTransformForm',
        formTemplateKey: 'perfectTransformFormTemplate',
        warning: () =>
          etlForm.get('perfectTransformForm')?.get('sdkVersion') &&
          !!etlForm.get('perfectTransformForm')?.get('sdkVersion')[warningKey],
        checkError: () => !!etlForm.get('perfectTransformForm')?.errors,
      },
    ] as Array<EtlDiagramNode>;
  }

  getPerfectTransformServices(allServices: Array<EtlServiceName>): Array<EtlServiceName> {
    return this.filterServiceByType(allServices, EtlServiceTypes.PerfectTransform);
  }

  deSerializeEtlToFormObj(etl: ETL): any {
    const rootForm = {
      ...etl,
      tags: etl.tags || [],
    };
    const perfectTransformService = etl.services[etl.servicesDag.root];
    const copyConfig = {
      ...(perfectTransformService?.configuration || {}),
    };
    const params = {
      ...(perfectTransformService?.configuration?.params || {}),
    };
    delete copyConfig.params;
    const perfectTransformForm = {
      perfectTransform: {
        ...perfectTransformService,
        sdkStatus: (perfectTransformService as any).sdk_status,
        sdkVersion: (perfectTransformService as any).sdk_version,
        dockerImagePath: (perfectTransformService as any).docker_image_path,
      },
      version: {
        name: perfectTransformService.version,
        id: perfectTransformService.version,
      } as MeAutoCompleteOption,
      configuration: copyConfig,
      params: params,
    };
    return {
      rootForm,
      perfectTransformForm,
    };
  }

  serializeFormToEtlObj(
    services: Array<EtlDagService>,
    formValue: any,
    prevMetadata?: Record<string, boolean>,
  ): ETL {
    const rootForm = {...formValue.rootForm};
    delete rootForm.triggerDataSourcesUpdate;
    const perfectTransformForm = formValue.perfectTransformForm;
    const servicesDag = this._generateServiceDag(services, perfectTransformForm);
    return {
      ...rootForm,
      servicesDag,
      name: rootForm.name,
      metadata: this._getEtlMetadata(formValue, prevMetadata),
    };
  }

  private _generateServiceDag(services: Array<EtlDagService>, perfectTransformForm: any): any {
    const perfectTransformService = this.getSelectedEtlDagService(
      services,
      perfectTransformForm.perfectTransform.name,
      perfectTransformForm.version.id,
      EtlServiceTypes.PerfectTransform,
    );

    return {
      root: perfectTransformService.id.toString(),
    };
  }

  private _getEtlMetadata(formValue: any, prevMetadata?: Record<string, boolean>): any {
    const metadata = {
      ...(prevMetadata || {}),
      triggerDataSourcesUpdate: formValue.rootForm.triggerDataSourcesUpdate,
    };

    const predicates = Object.values(metadata);

    if (predicates.some((p: boolean) => p)) {
      return metadata;
    }

    return null;
  }
}
