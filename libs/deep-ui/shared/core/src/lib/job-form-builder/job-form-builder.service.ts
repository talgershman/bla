import {Injectable} from '@angular/core';
import {FormControl, FormControlOptions} from '@angular/forms';
import {MeAutoCompleteOption} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {EtlJob} from 'deep-ui/shared/models';
import _find from 'lodash-es/find';
import _get from 'lodash-es/get';
import _isNil from 'lodash-es/isNil';

export type ControlItemType = MeSelectOption | MeAutoCompleteOption | string;

@Injectable({
  providedIn: 'root',
})
export class JobFormBuilderService {
  mainJob: EtlJob = null;

  depJob: Array<EtlJob> = [];

  setJobsLookup(mainJob: EtlJob, depJobs: Array<EtlJob> = []): void {
    this.mainJob = mainJob;
    this.depJob = depJobs;
  }

  resetAll(): void {
    this.mainJob = null;
    this.depJob = [];
  }

  createNewFormControl<T = any>(
    initialValue: any,
    jobLookUpPath: string,
    depJobId = '',
    options: FormControlOptions = {}
  ): FormControl<T> {
    let value = initialValue;
    if (this.mainJob) {
      const lookupValue = this._getControlValueFormJob(jobLookUpPath, depJobId);
      value = _isNil(lookupValue) ? initialValue : lookupValue;
    }
    return new FormControl<T>(value, options);
  }
  getValue(jobLookUpPath: string, depJobId = ''): any {
    return this._getControlValueFormJob(jobLookUpPath, depJobId);
  }
  private _getControlValueFormJob(jobLookUpPath: string, depJobId: string): any {
    const job = this._getRelevantJob(depJobId);
    return _get(job, jobLookUpPath);
  }

  private _getRelevantJob(depJobId: string): EtlJob {
    if (!depJobId) {
      return this.mainJob;
    }
    return _find(this.depJob, (job: EtlJob) => job.jobUuid === depJobId);
  }
}
