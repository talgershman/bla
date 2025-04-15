import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {BaseTourComponent} from 'deep-ui/shared/components/src/lib/common';
import {
  MestFormComponent,
  MestFormStateEvent,
} from 'deep-ui/shared/components/src/lib/forms/mest-form';
import {MestService} from 'deep-ui/shared/core';
import {MEST} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';

import {getBreadcrumbs} from './edit-mest-entities';

@Component({
  selector: 'de-edit-mest',
  templateUrl: './edit-mest.component.html',
  styleUrls: ['./edit-mest.component.scss'],
  hostDirectives: [BaseTourComponent],
  imports: [MeBreadcrumbsComponent, MestFormComponent, MeErrorFeedbackComponent],
})
export class EditMestComponent implements OnInit {
  public baseTour = inject(BaseTourComponent);
  private fullStory = inject(FullStoryService);
  private activatedRoute = inject(ActivatedRoute);
  private mestService = inject(MestService);
  private loadingService = inject(MeLoadingService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  mest: MEST = this.activatedRoute.snapshot.data.mest as MEST;

  errorMsg = '';

  breadcrumbs = getBreadcrumbs(this.mest);

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'edit-mest'});
  }

  onMestFormChanged(event: MestFormStateEvent): void {
    if (event.mest) {
      this.loadingService.showLoader();
      this.mestService
        .update(this.mest.id, event.mest, {})
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
      // no update needed
      this.onBackButtonPressed();
    }
  }

  onBackButtonPressed(mest?: MEST): void {
    const selected = mest || this.mest;
    this.router.navigate(['./manage/mests'], {
      state: selected ? {selected} : null,
    });
  }
}
