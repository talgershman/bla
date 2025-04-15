import {TemplateRef} from '@angular/core';

export enum MeStepperMenuStatusEnum {
  DONE = 'DONE',
  FAILED = 'FAILED',
  NOT_STARTED = 'NOTSTARTED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export interface MeStepperMenuItem {
  title: string;
  id: string;
  status: MeStepperMenuStatusEnum;
  tmpl?: TemplateRef<any>;
  tmplContext?: object | null;
}
