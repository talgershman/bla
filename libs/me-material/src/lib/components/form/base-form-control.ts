import {FormGroup} from '@angular/forms';
import {MeFieldConfig} from '@mobileye/material/src/lib/common';

export class MeBaseFormControl {
  field: MeFieldConfig;

  formGroup: FormGroup<any>;
}
