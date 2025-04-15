import {inject} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MeAutoCompleteOption} from '@mobileye/material/src/lib/components/form/autocomplete';
import {parseInteger} from '@mobileye/material/src/lib/utils';
import {DeepUtilService} from 'deep-ui/shared/core';
import {EtlDagService, EtlServiceName, EtlServiceTypes} from 'deep-ui/shared/models';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _uniqBy from 'lodash-es/uniqBy';

export interface EtlDiagramNode {
  id: string;
  title: string;
  formGroup: FormGroup<any>;
  formGroupName: string;
  formTemplateKey: string;
  showDelete?: boolean;
  warning?: () => boolean;
  checkError?: () => boolean;
}
export class EtlFormBaseService {
  protected deepUtilService = inject(DeepUtilService);

  generateRootNode = (form: FormGroup): any => {
    return {
      id: 'root',
      title: 'Root',
      formGroupName: 'rootForm',
      formGroup: form.get('rootForm') as FormGroup,
      formTemplateKey: 'rootFormTemplate',
    };
  };

  getVersionsByService(services: Array<EtlDagService>): Array<MeAutoCompleteOption> {
    const result = services.map((item: EtlDagService) => {
      return {
        name: item.version,
        id: item.version,
      } as MeAutoCompleteOption;
    });

    return result.sort((first: any, second: any): any => {
      const firstValue = first.name as string;
      const secondValue = second.name as string;
      if (firstValue.includes('master') && secondValue.includes('master')) {
        const firstVersion = firstValue
          .split('.')
          .map((n) => +n + 100000)
          .join('.');
        const secondVersion = secondValue
          .split('.')
          .map((n) => +n + 100000)
          .join('.');
        return firstVersion > secondVersion ? -1 : 1;
      }
      if (firstValue.includes('master')) {
        return -1;
      }
      if (secondValue.includes('master')) {
        return 1;
      }
      // both not master
      return firstValue > secondValue ? -1 : 1;
    });
  }

  getSelectedEtlDagService(
    services: Array<EtlDagService>,
    serviceName: string,
    version: string,
    type: EtlServiceTypes,
  ): EtlDagService {
    return _find(services, (service: EtlDagService) => {
      return service.version === version && type === service.type && service.name === serviceName;
    });
  }

  protected getEtlServiceById(services: Array<EtlDagService>, id: string): EtlDagService {
    const idNum = parseInteger(id);
    return _find(services, {id: idNum}) as EtlDagService;
  }

  protected filterServiceByType(
    allServiceNames: Array<EtlServiceName>,
    type: string,
  ): Array<EtlServiceName> {
    const result = _filter(allServiceNames, (item: EtlServiceName) => item.type === type);
    return _uniqBy(result, 'name');
  }
}
