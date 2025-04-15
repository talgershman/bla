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
import {getBreadcrumbs} from './edit-perfect-list-entities';

@Component({
  selector: 'de-edit-perfect-list',
  templateUrl: './edit-perfect-list.component.html',
  styleUrls: ['./edit-perfect-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeBreadcrumbsComponent, PerfectListFormComponent, MatFormFieldModule],
})
export class EditPerfectListComponent
  extends BaseCreateEditEntityDirective<PerfectList>
  implements OnInit
{
  private perfectListService = inject(PerfectListService);

  override backButtonRoute = ['./data-lake/perfect-lists'];

  // must be override
  override entityName = 'perfectList';

  override entity = this.getEntity();

  breadcrumbs = getBreadcrumbs(this.entity);

  private fullStory = inject(FullStoryService);

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'edit-perfect-list'});
  }

  onFromValueChanged(entity: Partial<PerfectList>): void {
    if (entity) {
      this.loadingService.showLoader();
      this.perfectListService
        .update(this.entity.id, this.entity.name, entity)
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
    } else {
      this.onBackButtonPressed();
    }
  }
}
