import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {BaseCreateEditEntityDirective} from 'deep-ui/shared/components/src/lib/common';
import {PerfectListService} from 'deep-ui/shared/core';
import {PerfectList} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';

import {PerfectListFormComponent} from '../../components/forms/perfect-list-form/perfect-list-form.component';
import {breadcrumbs} from './create-perfect-list-entities';

@Component({
  selector: 'de-create-perfect-list',
  templateUrl: './create-perfect-list.component.html',
  styleUrls: ['./create-perfect-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeBreadcrumbsComponent, PerfectListFormComponent, MatFormFieldModule],
})
export class CreatePerfectListComponent
  extends BaseCreateEditEntityDirective<PerfectList>
  implements OnInit
{
  private perfectListService = inject(PerfectListService);

  breadcrumbs = breadcrumbs;

  override backButtonRoute = ['./data-lake/perfect-lists'];

  // must be override
  override entityName = 'perfectList';

  override entity = this.getEntity();

  private fullStoryService = inject(FullStoryService);

  ngOnInit(): void {
    this.fullStoryService.setPage({pageName: 'create-perfect-list'});
  }

  onFromValueChanged(entity: Partial<PerfectList>): void {
    const perfectList = {...entity};
    if (!perfectList.perfectSearchUrl?.length) {
      delete perfectList.perfectSearchUrl;
    }
    this.loadingService.showLoader();
    this.perfectListService
      .create(perfectList, perfectList.name, {})
      .pipe(
        catchError((response) =>
          of({
            error: getErrorHtmlMsgFromResponse(response, true),
          }),
        ),
        finalize(() => this.loadingService.hideLoader()),
      )
      .subscribe((response: any) => {
        this.errorMsg = '';
        if (response?.error) {
          const errorObj = response.error ? response.error : response;
          this.errorMsg = errorObj.error || errorObj;
          this.cd.detectChanges();
        } else {
          this.onBackButtonPressed(response);
        }
      });
  }
}
