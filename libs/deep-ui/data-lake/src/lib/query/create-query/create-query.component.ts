import {CdkStepperModule} from '@angular/cdk/stepper';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {
  MeBreadcrumbItem,
  MeBreadcrumbsComponent,
} from '@mobileye/material/src/lib/components/breadcrumbs';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Datasource, SubQuery} from 'deep-ui/shared/models';
import {ReplaySubject} from 'rxjs';

import {QueryStepperComponent} from '../../components/steppers/query-stepper/query-stepper.component';
import {StepperContainerComponent} from '../../components/steppers/stepper-container/stepper-container.component';
import {StandaloneQueryComponent} from './standalone-query/standalone-query.component';

@UntilDestroy()
@Component({
  selector: 'de-create-query',
  templateUrl: './create-query.component.html',
  styleUrls: ['./create-query.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeBreadcrumbsComponent,
    StepperContainerComponent,
    CdkStepperModule,
    StandaloneQueryComponent,
    QueryStepperComponent,
  ],
})
export class CreateQueryComponent implements OnInit, AfterViewInit {
  @ViewChild(StepperContainerComponent, {static: true}) stepper;

  breadcrumbs: MeBreadcrumbItem[] = [
    {
      title: 'Query',
    },
  ];

  private activatedRoute = inject(ActivatedRoute);

  onLoadGoToEditQueryIndex =
    this.activatedRoute?.snapshot?.data?.viewData?.onLoadGoToEditQueryIndex;

  subQueries: Array<SubQuery> = this.activatedRoute?.snapshot?.data?.viewData?.subQueries || [];

  selectedDataSources: Array<Datasource> =
    this.activatedRoute?.snapshot?.data?.viewData?.selectedDataSources || [];

  triggerEditSubQuery = new ReplaySubject<SubQuery>(1);

  triggerEditSubQuery$ = this.triggerEditSubQuery.asObservable();

  triggerFirstStep = new ReplaySubject<void>(1);

  triggerFirstStep$ = this.triggerFirstStep.asObservable();

  hideDashboardView: boolean;

  private fullStory = inject(FullStoryService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.activatedRoute.queryParams.pipe(untilDestroyed(this)).subscribe((params: Params) => {
      if (params.forceReload) {
        this._resetPage();
      }
    });
    this.fullStory.setPage({pageName: 'create-query'});
    this.hideDashboardView = this._onLoadGoToEditQuery();
  }

  ngAfterViewInit(): void {
    this._handleNavigateToAfterLoaded();
  }

  handleAddSubQueryClicked(): void {
    this.triggerFirstStep.next();
    this.stepper.next();
  }

  handleEditSubQueryClicked(subQuery: SubQuery): void {
    this.triggerEditSubQuery.next(subQuery);
    this.stepper.next();
  }

  handleMoveBackedFromStepper(): void {
    this.hideDashboardView = false;
    this._clearTriggers();
    this.stepper.previous();
  }

  private _handleNavigateToAfterLoaded(): void {
    if (this._onLoadGoToEditQuery()) {
      const subQuery = this.subQueries[this.onLoadGoToEditQueryIndex];
      this.handleEditSubQueryClicked(subQuery);
    }
  }

  private _clearTriggers(): void {
    this.triggerFirstStep.complete();
    this.triggerFirstStep = new ReplaySubject<void>();
    this.triggerFirstStep$ = this.triggerFirstStep.asObservable();

    this.triggerEditSubQuery.complete();
    this.triggerEditSubQuery = new ReplaySubject<SubQuery>();
    this.triggerEditSubQuery$ = this.triggerEditSubQuery.asObservable();
  }

  private _onLoadGoToEditQuery(): boolean {
    return this.onLoadGoToEditQueryIndex !== null && this.onLoadGoToEditQueryIndex !== undefined;
  }

  private _resetPage(): void {
    this.hideDashboardView = false;
    this.selectedDataSources = [];
    this.subQueries = [];
    this.stepper.selectedIndex = 0;
    //clear params
    this.router?.navigate([], {
      queryParams: [],
    });
    setTimeout(() => {
      this.cd.detectChanges();
    });
  }
}
