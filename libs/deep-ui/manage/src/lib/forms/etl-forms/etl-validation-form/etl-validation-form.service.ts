import {Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MeAutoCompleteOption} from '@mobileye/material/src/lib/components/form/autocomplete';
import {ETL, EtlDagService, EtlServiceName, EtlServiceTypes} from 'deep-ui/shared/models';
import {warningKey} from 'deep-ui/shared/validators';

import {EtlDiagramNode, EtlFormBaseService} from '../etl-form-base.service';

@Injectable()
export class EtlValidationFormService extends EtlFormBaseService {
  generateProbeLogicNode = (form: FormGroup): any => {
    return {
      id: 'probeLogic',
      title: 'ETL Logic',
      formGroupName: 'probeLogicForm',
      formGroup: form.get('probeLogicForm') as FormGroup,
      formTemplateKey: 'probeLogicFormTemplate',
      showDelete: true,
      warning: () =>
        form.get('probeLogicForm')?.get('sdkVersion') &&
        !!form.get('probeLogicForm')?.get('sdkVersion')[warningKey],
      checkError: () => !!form.get('probeLogicForm')?.errors,
    };
  };

  generateGenericDataPrepNode = (form: FormGroup): any => {
    return {
      id: 'dataPrep',
      title: 'Data Prep',
      formGroupName: 'dataPrepForm',
      formGroup: form.get('dataPrepForm') as FormGroup,
      formTemplateKey: 'dataPrepFormTemplate',
      warning: () =>
        form.get('dataPrepForm')?.get('sdkVersion') &&
        !!form.get('dataPrepForm')?.get('sdkVersion')[warningKey],
      checkError: () => !!form.get('dataPrepForm')?.errors,
    };
  };

  getDiagramNodes(etlForm: FormGroup): Array<EtlDiagramNode> {
    const arr: Array<EtlDiagramNode> = [this.generateRootNode(etlForm)];
    if (etlForm.get('probeLogicForm')) {
      const node = this.generateProbeLogicNode(etlForm);
      arr.splice(1, 0, node);
    }
    if (etlForm.get('dataPrepForm')) {
      const node = this.generateGenericDataPrepNode(etlForm);
      arr.splice(1, 0, node);
    }
    return arr;
  }

  getEtlLogicServices(allServiceNames: Array<EtlServiceName>): Array<EtlServiceName> {
    return this.filterServiceByType(allServiceNames, EtlServiceTypes.ProbeLogic);
  }

  getDataPrepServices(allServiceNames: Array<EtlServiceName>): Array<EtlServiceName> {
    return this.filterServiceByType(allServiceNames, EtlServiceTypes.DataPrep);
  }

  deSerializeEtlToFormObj(etl: ETL): any {
    const rootForm = {
      ...etl,
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
        if (etlService.type === EtlServiceTypes.DataPrep) {
          formAttr = 'dataPrepForm';
        } else if (etlService.type === EtlServiceTypes.ProbeLogic) {
          formAttr = 'probeLogicForm';
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
    const probLogicForm = formValue.probeLogicForm;
    const dataPrepForm = formValue.dataPrepForm;
    const resourcesDefinition = this._generateResourcesDefinitionObj(
      services,
      dataPrepForm,
      probLogicForm,
    );
    const servicesDag = this._generateServiceDag(services, dataPrepForm, probLogicForm);
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
    dataPrepForm: any,
    probLogicForm: any,
  ): any {
    const result = {};

    const dataPrepService = this.getSelectedEtlDagService(
      services,
      dataPrepForm.dataPrep.name,
      dataPrepForm.version.id,
      EtlServiceTypes.DataPrep,
    );

    if (dataPrepForm && dataPrepForm.capacityChecked) {
      const id = dataPrepService.id;
      result[id] = dataPrepForm.resourcesDefinition;
    }

    if (probLogicForm) {
      const etlLogicService = this.getSelectedEtlDagService(
        services,
        probLogicForm.probeLogic.name,
        probLogicForm.version.id,
        EtlServiceTypes.ProbeLogic,
      );
      if (probLogicForm && probLogicForm.capacityChecked) {
        const id = etlLogicService.id;
        result[id] = probLogicForm.resourcesDefinition;
      }
    }

    if (!Object.keys(result).length) {
      return null;
    }
    return result;
  }

  private _generateServiceDag(
    services: Array<EtlDagService>,
    dataPrepForm: any,
    probLogicForm: any,
  ): any {
    const dataPrepService = this.getSelectedEtlDagService(
      services,
      dataPrepForm.dataPrep.name,
      dataPrepForm.version.id,
      EtlServiceTypes.DataPrep,
    );
    const result = {
      root: dataPrepService.id.toString(),
    };
    if (probLogicForm) {
      const etlLogicService = this.getSelectedEtlDagService(
        services,
        probLogicForm.probeLogic.name,
        probLogicForm.version.id,
        EtlServiceTypes.ProbeLogic,
      );
      result[dataPrepService.id] = etlLogicService.id.toString();
    }
    return result;
  }
}
