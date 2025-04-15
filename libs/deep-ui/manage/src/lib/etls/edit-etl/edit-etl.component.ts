import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeErrorHandlerService} from '@mobileye/material/src/lib/services/error-handler';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {
  DataRetentionService,
  EtlService,
  LaunchService,
  SubmitJobPerfectTransform,
  SubmitJobResponse,
} from 'deep-ui/shared/core';
import {
  Datasource,
  ETL,
  EtlServiceName,
  EtlTypeEnum,
  EtlTypes,
  ParsingConfiguration,
} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';

import {EtlModelInferenceFormComponent} from '../../forms/etl-forms/etl-model-inference-form/etl-model-inference-form.component';
import {EtlPerfectTransformFormComponent} from '../../forms/etl-forms/etl-perfect-transform-form/etl-perfect-transform-form.component';
import {EtlValidationFormComponent} from '../../forms/etl-forms/etl-validation-form/etl-validation-form.component';
import {getBreadcrumbs} from './edit-etl-entities';

@Component({
  selector: 'de-edit-etl',
  templateUrl: './edit-etl.component.html',
  styleUrls: ['./edit-etl.component.scss'],
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
export class EditEtlComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private loadingService = inject(MeLoadingService);
  private router = inject(Router);
  private etlService = inject(EtlService);
  private dataRetentionService = inject(DataRetentionService);
  private cd = inject(ChangeDetectorRef);
  private snackbar = inject(MeSnackbarService);
  private launchService = inject(LaunchService);
  private errorHandlerService = inject(MeErrorHandlerService);
  private fullStory = inject(FullStoryService);

  etl: ETL = this.activatedRoute.snapshot.data.viewData.etl as ETL;

  breadcrumbs = getBreadcrumbs(this.etl);

  etlOptionsTypes: Array<MeSelectOption> = EtlTypes.map((type: string) => {
    return {
      id: type,
      value: _startCase(type),
    } as MeSelectOption;
  });

  EtlTypeEnum = EtlTypeEnum;

  etlTypeControl = new FormControl<EtlTypeEnum>({
    value: this.etl.type || EtlTypeEnum.VALIDATION,
    disabled: true,
  });

  serviceNames: Array<EtlServiceName> = this.activatedRoute.snapshot.data.viewData
    .serviceNames as Array<EtlServiceName>;

  parsingConfigs: Array<ParsingConfiguration> = this.activatedRoute.snapshot.data.viewData
    .parsingConfigs as Array<ParsingConfiguration>;

  errorMsg: string;

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'edit-etl'});
  }

  onBackButtonPressed(etl?: ETL): void {
    this.router.navigate(['./manage/etls'], {
      state: {selected: etl || this.etl},
    });
  }

  redirectToPerfectJobs(): void {
    this.router.navigate(['./jobs'], {
      queryParams: {view: 'PERFECT_TRANSFORM'},
    });
  }

  onEtlFormChanged(obj: {etl: ETL; dataSources?: Array<Datasource>; budgetGroup?: string}): void {
    const {etl, dataSources, budgetGroup} = obj;
    if (dataSources?.length > 0) {
      this._handleAutoUpdateSourcesFlow(etl, dataSources, budgetGroup);
    } else {
      this._handleEtlPublishFlow(etl);
    }
  }

  private _handleAutoUpdateSourcesFlow(
    etl: ETL,
    dataSources: Array<Datasource>,
    budgetGroup: string,
  ): void {
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
        )
        .subscribe((response: any) => {
          this.errorMsg = '';
          if (response?.error) {
            this._handleCreateEtlError(response);
          } else {
            this._getSubmitJobRequests(response, dataSources, budgetGroup, etl);
          }
        });
    } else {
      this.onBackButtonPressed();
    }
  }

  private _handleEtlPublishFlow(etl: ETL): void {
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
            this._handleCreateEtlError(response);
          } else {
            this.onBackButtonPressed(etl);
          }
        });
    } else {
      this.onBackButtonPressed();
    }
  }

  private _generateSubmitRequest(
    etl: ETL,
    dataSource: Datasource,
    budgetGroup: string,
  ): Observable<SubmitJobResponse> {
    const submitJobRequest: SubmitJobPerfectTransform = {
      flowType: 'PERFECT_TRANSFORM',
      runType: 'UPDATE',
      ...(budgetGroup?.length && {budgetGroup: budgetGroup}),
      probeId: etl.id,
      dataSourceId: dataSource.id,
      perfectListIds: dataSource.perfectListIds,
      dataRetention: this.dataRetentionService.getPerfectDataRetentionObj(dataSource),
    };

    return (this.launchService.submitJob(submitJobRequest) as Observable<SubmitJobResponse>).pipe(
      catchError((response: HttpErrorResponse) =>
        of({
          error: getErrorHtmlMsgFromResponse(response),
        }),
      ),
    );
  }

  private _getSubmitJobRequests(
    etl: ETL,
    dataSources: Array<Datasource>,
    budgetGroup: string,
    oldEtl: ETL,
  ): void {
    this.snackbar.open('Updating Data sources...');
    forkJoin(dataSources.map((ds) => this._generateSubmitRequest(etl, ds, budgetGroup)))
      .pipe(finalize(() => this.loadingService.hideLoader()))
      .subscribe((jobResponses: Array<SubmitJobResponse | {error: any}>) => {
        this.errorMsg = '';
        let numberOfErrors = 0;
        if (jobResponses?.length) {
          for (const job of jobResponses) {
            if (job?.error) {
              this.errorHandlerService.raiseError({
                title: 'Error',
                innerHtml: JSON.stringify(job.error).trim(),
              });
              numberOfErrors++;
            }
          }
        }

        if (numberOfErrors < jobResponses.length) {
          this.redirectToPerfectJobs();
        } else {
          this.onBackButtonPressed(oldEtl);
        }
      });
  }

  private _handleCreateEtlError(response: any): void {
    const errorObj = response.error ? response.error : response;
    this.errorMsg = errorObj.error || errorObj;
    this.cd.detectChanges();
  }
}
