import {animate, state, style, transition, trigger} from '@angular/animations';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {MeErrorObject, MeErrorType} from '@mobileye/material/src/lib/services/error-handler';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {Toast, ToastPackage, ToastrService} from 'ngx-toastr';

export enum ErrorDetailsState {
  HIDE = 'hide',
  SHOW = 'show',
}

const TOAST_JIRA_TICKET_TEMPLATE =
  'https://jira.mobileye.com/secure/CreateIssueDetails!init.jspa?pid=19742&issuetype=1&components=35607&priority=[PRIORITY_PLACEHOLDER]&summary=[SUMMARY_PLACEHOLDER]&description=[DESCRIPTION_PLACEHOLDER]';

const MINOR_PRIORITY = '5';

const SUMMARY = '%3CMY+ISSUE+TITLE%3E';

const TEMPLATE_DESCRIPTION_ERROR = '+%3CDESCRIBE+MY+ERROR%3E';

const TEMPLATE_DESCRIPTION_REPRODUCE_STEPS = '+%3CTHE+STEPS+TO+REPRODUCE+THE+ERROR%3E';

const DEFAULT_TEMPLATE_DESCRIPTION_REQUEST = '+%3CTHE+ERROR+REQUEST%3E';

const DEFAULT_TEMPLATE_DESCRIPTION_RESPONSE = '+%3CTHE+ERROR+RESPONSE%3E';

const DEFAULT_TEMPLATE_DESCRIPTION_STATUS = '+%3CTHE+ERROR+STATUS%3E';

@Component({
  selector: 'me-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state(ErrorDetailsState.HIDE, style({height: '0px', minHeight: '0'})),
      state(ErrorDetailsState.SHOW, style({height: '*'})),
      transition('* <=> *', animate('300ms ease-in')),
    ]),
  ],
  preserveWhitespaces: false,
  imports: [MatButtonModule, MatIconModule, NgTemplateOutlet, MeSafePipe],
})
export class MeToastComponent extends Toast implements OnInit {
  protected override toastrService = inject(ToastrService, {optional: true})!;
  override toastPackage = inject(ToastPackage);
  private fullStory = inject(FullStoryService);

  ErrorDetailsState = ErrorDetailsState;

  MeErrorType = MeErrorType;

  isExpanded: boolean;

  toastJiraTicket: string;

  data: MeErrorObject;

  sessionReplayUrl: string;

  async ngOnInit(): Promise<void> {
    this.data = JSON.parse(this.message);
    this.sessionReplayUrl = await this.fullStory.getCurrentSessionUrl();
    this._setToastJiraTicket();
  }

  isString(variable: any): boolean {
    return typeof variable === 'string';
  }

  stringify(msg: string): string {
    return JSON.stringify(msg, null, 2);
  }

  private _replaceSpecialCharacters(str: string): string {
    return str?.replace('&', '%26')?.replace('#', '%23');
  }

  private _setToastJiraTicket(): void {
    this.toastJiraTicket = TOAST_JIRA_TICKET_TEMPLATE.replace(
      '[PRIORITY_PLACEHOLDER]',
      MINOR_PRIORITY,
    )
      .replace('[SUMMARY_PLACEHOLDER]', SUMMARY)
      .replace('[DESCRIPTION_PLACEHOLDER]', this._getToastJiraTicketDescription());
  }

  private _getToastJiraTicketDescription(): string {
    const req =
      this.data?.request !== undefined
        ? this._replaceSpecialCharacters(this.data.request)
        : DEFAULT_TEMPLATE_DESCRIPTION_REQUEST;
    const res = this._getDescriptionResponse();
    const status =
      this.data?.status !== undefined ? this.data.status : DEFAULT_TEMPLATE_DESCRIPTION_STATUS;
    return (
      `error:${TEMPLATE_DESCRIPTION_ERROR}%0D%0A%0D%0A` +
      `reproduce%20steps:${TEMPLATE_DESCRIPTION_REPRODUCE_STEPS}%0D%0A%0D%0A` +
      `request:${req}%0D%0A%0D%0A` +
      `response:${res}%0D%0A%0D%0A` +
      `status:${status}%0D%0A%0D%0A` +
      `Fullstory session (DON'T REMOVE):${this.sessionReplayUrl}%0D%0A%0D%0A`
    );
  }

  private _getDescriptionResponse(): string {
    if (this.data?.response === undefined) {
      return DEFAULT_TEMPLATE_DESCRIPTION_RESPONSE;
    }

    return this.isString(this.data.response)
      ? this._replaceSpecialCharacters(this.data.response)
      : this._replaceSpecialCharacters(this.stringify(this.data.response));
  }
}
