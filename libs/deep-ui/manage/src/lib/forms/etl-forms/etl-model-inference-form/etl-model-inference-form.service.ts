import {Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MeAutoCompleteOption} from '@mobileye/material/src/lib/components/form/autocomplete';
import {ETL, EtlDagService, EtlServiceName, EtlServiceTypes} from 'deep-ui/shared/models';
import {warningKey} from 'deep-ui/shared/validators';

import {EtlDiagramNode, EtlFormBaseService} from '../etl-form-base.service';

@Injectable({
  providedIn: 'root',
})
export class EtlModelInferenceFormService extends EtlFormBaseService {
  generateLogicNode = (form: FormGroup): any => {
    return {
      id: 'logic',
      title: 'Logic',
      formGroupName: 'logicForm',
      formGroup: form.get('logicForm') as FormGroup,
      formTemplateKey: 'logicFormTemplate',
      showDelete: true,
      warning: () =>
        form.get('logicForm')?.get('sdkVersion') &&
        !!form.get('logicForm')?.get('sdkVersion')[warningKey],
      checkError: () => !!form.get('logicForm')?.errors,
    };
  };

  generateGenericDataPrepNode = (form: FormGroup): any => {
    return {
      id: 'genericDataPrep',
      title: 'Generic Data Prep',
      formGroupName: 'genericDataPrepForm',
      formGroup: form.get('genericDataPrepForm') as FormGroup,
      formTemplateKey: 'genericDataPrepFormTemplate',
      warning: () =>
        form.get('genericDataPrepForm')?.get('sdkVersion') &&
        !!form.get('genericDataPrepForm')?.get('sdkVersion')[warningKey],
      checkError: () => !!form.get('genericDataPrepForm')?.errors,
    };
  };

  getDiagramNodes(etlForm: FormGroup): Array<EtlDiagramNode> {
    const arr: Array<EtlDiagramNode> = [this.generateRootNode(etlForm)];
    if (etlForm.get('logicForm')) {
      const node = this.generateLogicNode(etlForm);
      arr.splice(1, 0, node);
    }
    if (etlForm.get('genericDataPrepForm')) {
      const node = this.generateGenericDataPrepNode(etlForm);
      arr.splice(1, 0, node);
    }
    return arr;
  }

  getLogicServices(allServiceNames: Array<EtlServiceName>): Array<EtlServiceName> {
    return this.filterServiceByType(allServiceNames, EtlServiceTypes.Logic);
  }

  getGenericDataPrepServices(allServiceNames: Array<EtlServiceName>): Array<EtlServiceName> {
    return this.filterServiceByType(allServiceNames, EtlServiceTypes.GenericDataPrep);
  }

  deSerializeEtlToFormObj(etl: ETL): any {
    const rootForm = {
      ...etl,
      tags: etl.tags || [],
    };

    let nextServiceIdStr = etl.servicesDag.root;
    const result = {
      rootForm,
    };

    while (nextServiceIdStr) {
      // eslint-disable-next-line
      const serviceId = parseInt(nextServiceIdStr);
      if (!isNaN(serviceId)) {
        const etlService = etl.services[serviceId];
        const resourcesDefinition = etl.resourcesDefinition
          ? etl.resourcesDefinition[etlService.id]
          : null;
        let formAttr;
        if (etlService.type === EtlServiceTypes.GenericDataPrep) {
          formAttr = 'genericDataPrepForm';
        } else if (etlService.type === EtlServiceTypes.Logic) {
          formAttr = 'logicForm';
        }
        result[formAttr] = {
          [etlService.type]: {
            ...etlService,
            sdkStatus: (etlService as any).sdk_status,
            sdkVersion: (etlService as any).sdk_version,
            dockerImagePath: (etlService as any).docker_image_path,
          },
          version: {
            name: etlService.version,
            id: etlService.version,
          } as MeAutoCompleteOption,
          configuration: etlService.configuration,
          resourcesDefinition,
        };
      }
      nextServiceIdStr = etl.servicesDag[nextServiceIdStr];
    }
    return result;
  }

  serializeFormToEtlObj(services: Array<EtlDagService>, formValue: any): ETL {
    const rootForm = formValue.rootForm;
    const logicForm = formValue.logicForm;
    const genericDataPrepForm = formValue.genericDataPrepForm;
    const resourcesDefinition = this._generateResourcesDefinitionObj(
      services,
      genericDataPrepForm,
      logicForm,
    );
    const servicesDag = this._generateServiceDag(services, genericDataPrepForm, logicForm);
    const parsingConfiguration = rootForm.parsingConfiguration?.id;
    return {
      ...rootForm,
      resourcesDefinition,
      servicesDag,
      parsingConfiguration,
    };
  }

  private _generateResourcesDefinitionObj(
    services: Array<EtlDagService>,
    genericDataPrepForm: any,
    logicForm: any,
  ): any {
    const result = {};

    const genericDataPrepService = this.getSelectedEtlDagService(
      services,
      genericDataPrepForm.genericDataPrep.name,
      genericDataPrepForm.version.id,
      EtlServiceTypes.GenericDataPrep,
    );

    if (genericDataPrepForm && genericDataPrepForm.capacityChecked) {
      const id = genericDataPrepService.id;
      result[id] = genericDataPrepForm.resourcesDefinition;
    }

    if (logicForm) {
      const logicService = this.getSelectedEtlDagService(
        services,
        logicForm.logic.name,
        logicForm.version.id,
        EtlServiceTypes.Logic,
      );
      if (logicForm && logicForm.capacityChecked) {
        const id = logicService.id;
        result[id] = logicForm.resourcesDefinition;
      }
    }

    if (!Object.keys(result).length) {
      return null;
    }
    return result;
  }

  private _generateServiceDag(
    services: Array<EtlDagService>,
    genericDataPrepForm: any,
    logicForm: any,
  ): any {
    const genericDataPrepService = this.getSelectedEtlDagService(
      services,
      genericDataPrepForm.genericDataPrep.name,
      genericDataPrepForm.version.id,
      EtlServiceTypes.GenericDataPrep,
    );
    const result = {
      root: genericDataPrepService.id.toString(),
    };
    if (logicForm) {
      const logicService = this.getSelectedEtlDagService(
        services,
        logicForm.logic.name,
        logicForm.version.id,
        EtlServiceTypes.Logic,
      );
      result[genericDataPrepService.id] = logicService.id.toString();
    }
    return result;
  }
}
