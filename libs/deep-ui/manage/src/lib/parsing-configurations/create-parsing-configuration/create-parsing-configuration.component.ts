import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {BaseTourComponent} from 'deep-ui/shared/components/src/lib/common';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {ParsingConfiguration} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';

import {ParsingConfigurationFormComponent} from '../../forms/parsing-configuration-form/parsing-configuration-form.component';
import {breadcrumbs} from './create-parsing-configuration-entities';

@Component({
  selector: 'de-create-parsing-configuration',
  templateUrl: './create-parsing-configuration.component.html',
  styleUrls: ['./create-parsing-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BaseTourComponent],
  imports: [MeBreadcrumbsComponent, ParsingConfigurationFormComponent, MeErrorFeedbackComponent],
})
export class CreateParsingConfigurationComponent implements OnInit {
  public baseTour = inject(BaseTourComponent);
  private fullStory = inject(FullStoryService);
  private parsingConfigurationService = inject(ParsingConfigurationService);
  private loadingService = inject(MeLoadingService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  breadcrumbs = breadcrumbs;

  errorMsg: string;

  parsingConfiguration = this.router.getCurrentNavigation()?.extras.state
    ? this.router.getCurrentNavigation().extras.state.parsingConfiguration
    : {};

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'create-parsing-configuration'});
  }

  onParsingFormChanged(configuration: ParsingConfiguration): void {
    if (configuration) {
      this.loadingService.showLoader();
      this.parsingConfigurationService
        .create(configuration, {})
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
            this.onBackButtonPressed(response as ParsingConfiguration);
          }
        });
    }
  }

  onBackButtonPressed(parsingConfiguration?: ParsingConfiguration): void {
    const selectedParsing = parsingConfiguration || this.parsingConfiguration;
    if (selectedParsing) {
      this.router.navigate(['./manage/parsing-configurations'], {
        state: {selected: selectedParsing},
      });
    } else {
      this.router.navigate(['./manage/parsing-configurations']);
    }
  }
}
