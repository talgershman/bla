import {Component, inject, OnInit} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {
  ETL,
  EtlServiceName,
  EtlTypeEnum,
  EtlTypes,
  ParsingConfiguration,
} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

import {EtlModelInferenceFormComponent} from '../../forms/etl-forms/etl-model-inference-form/etl-model-inference-form.component';
import {EtlPerfectTransformFormComponent} from '../../forms/etl-forms/etl-perfect-transform-form/etl-perfect-transform-form.component';
import {EtlValidationFormComponent} from '../../forms/etl-forms/etl-validation-form/etl-validation-form.component';
import {getBreadcrumbs} from './view-etl-entities';

@Component({
  selector: 'de-view-etl',
  templateUrl: './view-etl.component.html',
  styleUrls: ['./view-etl.component.scss'],
  imports: [
    MeBreadcrumbsComponent,
    MeSelectComponent,
    EtlValidationFormComponent,
    EtlModelInferenceFormComponent,
    EtlPerfectTransformFormComponent,
    ReactiveFormsModule,
  ],
})
export class ViewEtlComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
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

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'view-etl'});
  }

  onBackButtonPressed(): void {
    this.router.navigate(['./manage/etls'], {
      state: {selected: this.etl},
    });
  }
}
