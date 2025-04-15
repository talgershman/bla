import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {BaseTourComponent} from 'deep-ui/shared/components/src/lib/common';
import {ParsingConfiguration} from 'deep-ui/shared/models';

import {ParsingConfigurationFormComponent} from '../../forms/parsing-configuration-form/parsing-configuration-form.component';
import {getBreadcrumbs} from './view-parsing-configuration-entities';

@Component({
  selector: 'de-view-parsing-configuration',
  templateUrl: './view-parsing-configuration.component.html',
  styleUrls: ['./view-parsing-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BaseTourComponent],
  imports: [MeBreadcrumbsComponent, ParsingConfigurationFormComponent],
})
export class ViewParsingConfigurationComponent implements OnInit {
  public baseTour = inject(BaseTourComponent);
  private fullStory = inject(FullStoryService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  parsingConfiguration: ParsingConfiguration = this.activatedRoute.snapshot.data
    .parsingConfiguration as ParsingConfiguration;

  breadcrumbs = getBreadcrumbs(this.parsingConfiguration);

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'view-parsing-configuration'});
  }

  onBackButtonPressed(): void {
    this.router.navigate(['./manage/parsing-configurations'], {
      state: {selected: this.parsingConfiguration},
    });
  }
}
