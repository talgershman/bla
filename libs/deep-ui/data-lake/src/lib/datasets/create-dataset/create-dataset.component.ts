import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {DatasetService} from 'deep-ui/shared/core';
import {Dataset, Datasource, SubQuery} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';

import {DatasetStepperComponent} from '../../components/steppers/dataset-stepper/dataset-stepper.component';
import {breadcrumbs} from './create-dataset-entities';

@Component({
  selector: 'de-create-dataset',
  templateUrl: './create-dataset.component.html',
  styleUrls: ['./create-dataset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeBreadcrumbsComponent, DatasetStepperComponent],
})
export class CreateDatasetComponent implements OnInit {
  breadcrumbs = breadcrumbs;

  private loadingService = inject(MeLoadingService);
  private activatedRoute = inject(ActivatedRoute);
  private datasetService = inject(DatasetService);
  private router = inject(Router);
  private fullStory = inject(FullStoryService);
  private cd = inject(ChangeDetectorRef);
  //because the resolver end the navigation, activatedRoute state not always has the data when reached to the component.
  // Therefore, we check extra.state in the create resolver and pass it the component
  dataset = this.activatedRoute.snapshot.data.viewData?.dataset;

  subQueries: Array<SubQuery> =
    this.activatedRoute.snapshot.data.viewData?.dataset?.queryJson || [];

  selectedDataSources: Array<Datasource> =
    this.activatedRoute.snapshot.data.viewData?.selectedDataSources || [];

  errorMsg = '';

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'create-dataset'});
  }

  onFormValueChanged(dataSet: Dataset): void {
    this.loadingService.showLoader();
    this.datasetService
      .create(dataSet, {})
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

  onBackButtonPressed(dataset?: Dataset): void {
    const selected = dataset || this.dataset;
    this.router.navigate(['./data-lake/datasets'], {
      state: selected ? {selected} : null,
    });
  }
}
