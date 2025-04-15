import {FormControl, FormGroup} from '@angular/forms';
import {MeAutoCompleteOption} from '@mobileye/material/src/lib/components/form/autocomplete';
import {EtlDagService, EtlServiceName, SdkStatus} from 'deep-ui/shared/models';

export const DEFAULT_ETL_SDK_VERSION = 'N/A';

export type EtlValidationProbeLogicFormGroupType = {
  dockerImagePath: FormControl<string | null>;
  capacityChecked: FormControl<boolean | null>;
  configuration: FormControl<null>;
  versionOptions: FormControl<Array<MeAutoCompleteOption> | null>;
  resourcesDefinition: FormGroup<{
    runtime: FormControl<number | null>;
    ram: FormControl<number | null>;
  }>;
  sdkVersion: FormControl<string | null>;
  probeLogic: FormControl<
    (MeAutoCompleteOption & EtlServiceName) | (MeAutoCompleteOption & EtlDagService) | null
  >;
  sdkStatus: FormControl<SdkStatus | null>;
  version: FormControl<MeAutoCompleteOption | null>;
};
