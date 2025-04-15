import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {EtlService} from 'deep-ui/shared/core';
import {
  Datasource,
  ETL,
  EtlServiceName,
  EtlTemplateOptions,
  EtlTypeEnum,
  ParsingConfiguration,
} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';

import {EtlModelInferenceFormComponent} from '../../forms/etl-forms/etl-model-inference-form/etl-model-inference-form.component';
import {EtlPerfectTransformFormComponent} from '../../forms/etl-forms/etl-perfect-transform-form/etl-perfect-transform-form.component';
import {EtlValidationFormComponent} from '../../forms/etl-forms/etl-validation-form/etl-validation-form.component';
import {breadcrumbs} from './create-etl-entities';

@Component({
  selector: 'de-create-et;',
  templateUrl: './create-etl.component.html',
  styleUrls: ['./create-etl.component.scss'],
  imports: [
    MeBreadcrumbsComponent,
    MeSelectComponent,
    EtlValidationFormComponent,
    MeErrorFeedbackComponent,
    EtlModelInferenceFormComponent,
    EtlPerfectTransformFormComponent,
    ReactiveFormsModule,
  ],
})
export class CreateEtlComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private loadingService = inject(MeLoadingService);
  private router = inject(Router);
  private etlService = inject(EtlService);
  private cd = inject(ChangeDetectorRef);
  private fullStory = inject(FullStoryService);

  breadcrumbs = breadcrumbs;

  etlOptionsTypes: Array<MeSelectOption> = EtlTemplateOptions;

  EtlTypeEnum = EtlTypeEnum;

  etlTypeControl = new FormControl<EtlTypeEnum>(null);

  serviceNames: Array<EtlServiceName> = this.activatedRoute.snapshot.data.viewData
    .serviceNames as Array<EtlServiceName>;

  parsingConfigs: Array<ParsingConfiguration> = this.activatedRoute.snapshot.data.viewData
    .parsingConfigs as Array<ParsingConfiguration>;

  errorMsg: string;

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'create-etl'});
  }

  onBackButtonPressed(etl?: ETL): void {
    if (etl) {
      this.router.navigate(['./manage/etls'], {
        state: {selected: etl},
      });
    } else {
      this.router.navigate(['./manage/etls']);
    }
  }

  onEtlFormChanged(obj: {etl: ETL; dataSources?: Array<Datasource>}): void {
    const {etl} = obj;
    if (etl) {
      this.loadingService.showLoader();
      this.etlService
        .create(etl, {})
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
            this.onBackButtonPressed(etl);
          }
        });
    }
  }
}
