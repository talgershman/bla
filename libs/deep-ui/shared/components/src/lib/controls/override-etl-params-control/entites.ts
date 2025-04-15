import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {EtlDagService} from 'deep-ui/shared/models';

export interface ServiceFormGroup {
  title: FormControl<string>;
  type: FormControl<string>;
  id: FormControl<string>;
  params: FormControl<any>;
  uploadFiles: FormArray<FormGroup<UploadFilesFormGroup>>;
}

export interface ServiceFormValue {
  title: string;
  type: string;
  id: string;
  params: any;
  uploadFiles: Array<{type: string; path: string}>;
}

export interface UploadFilesFormGroup {
  path: FormControl<string>;
  type: FormControl<string>;
}

export interface ServicesDagObject {
  [key: string]: EtlDagService;
}
