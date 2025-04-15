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
import {getBreadcrumbs} from './edit-dataset-entities';

@Component({
  selector: 'de-edit-dataset',
  templateUrl: './edit-dataset.component.html',
  styleUrls: ['./edit-dataset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeBreadcrumbsComponent, DatasetStepperComponent],
})
export class EditDatasetComponent implements OnInit {
  errorMsg = '';

  private loadingService = inject(MeLoadingService);
  private activatedRoute = inject(ActivatedRoute);
  private datasetService = inject(DatasetService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private fullStory = inject(FullStoryService);

  dataset: Dataset = this.activatedRoute.snapshot.data.viewData.dataset as Dataset;

  subQueries: Array<SubQuery> = this.activatedRoute.snapshot.data.viewData.dataset
    .queryJson as Array<SubQuery>;

  selectedDataSources: Array<Datasource> = this.activatedRoute.snapshot.data.viewData
    .selectedDataSources as Array<Datasource>;

  breadcrumbs = getBreadcrumbs(this.dataset);

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'edit-dataset'});
  }

  onFormValueChanged(dataSet: Dataset): void {
    if (dataSet) {
      this.loadingService.showLoader();
      this.datasetService
        .update(this.dataset.id, dataSet, {})
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

  onBackButtonPressed(dataset?: Dataset): void {
    const selected = dataset || this.dataset;
    this.router.navigate(['./data-lake/datasets'], {
      state: selected ? {selected} : {},
    });
  }
}
