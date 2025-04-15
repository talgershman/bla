import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {BaseTourComponent} from 'deep-ui/shared/components/src/lib/common';
import {
  MestFormComponent,
  MestFormStateEvent,
} from 'deep-ui/shared/components/src/lib/forms/mest-form';
import {MestService} from 'deep-ui/shared/core';
import {MEST} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';

import {breadcrumbs} from './create-mest-entities';

@Component({
  selector: 'de-create-mest',
  templateUrl: './create-mest.component.html',
  styleUrls: ['./create-mest.component.scss'],
  hostDirectives: [BaseTourComponent],
  imports: [MeBreadcrumbsComponent, MestFormComponent, MeErrorFeedbackComponent],
})
export class CreateMestComponent implements OnInit {
  private mestService = inject(MestService);
  private loadingService = inject(MeLoadingService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private fullStory = inject(FullStoryService);

  breadcrumbs = breadcrumbs;

  errorMsg = '';

  mest = this.router.getCurrentNavigation()?.extras?.state?.mest || {};

  baseTour = inject(BaseTourComponent);

  ngOnInit(): void {
    if (Object.keys(this.mest || {}).length) {
      this.fullStory.setPage({pageName: 'create-mest'});
      if (Object.keys(this.mest).length) {
        this.mest = {
          ...this.mest,
          nickname: `${this.mest.nickname}${DUPLICATE_SUFFIX_STR}`,
        };
      }
    }
  }

  onMestFormChanged(event: MestFormStateEvent): void {
    if (event.mest) {
      this.loadingService.showLoader();
      this.mestService
        .create(event.mest, {})
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

  onBackButtonPressed(mest?: MEST): void {
    const selected = mest || this.mest;
    this.router.navigate(['./manage/mests'], {
      state: selected ? {selected} : null,
    });
  }
}
