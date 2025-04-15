import {Component, OnInit} from '@angular/core';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {AgBaseIndexPageDirective} from 'deep-ui/shared/components/src/lib/common';
import {ParsingConfigTableComponent} from 'deep-ui/shared/components/src/lib/tables/parsing-config-table';
import {ParsingConfiguration} from 'deep-ui/shared/models';

import {actionButtons, breadcrumbs} from './index-parsing-configuration-entites';

@Component({
  selector: 'de-index-parsing-configuration',
  templateUrl: './index-parsing-configuration.component.html',
  styleUrls: ['./index-parsing-configuration.component.scss'],
  imports: [MeBreadcrumbsComponent, AgEntityListComponent, ParsingConfigTableComponent],
})
export class IndexParsingConfigurationComponent
  extends AgBaseIndexPageDirective<ParsingConfiguration>
  implements OnInit
{
  breadcrumbs = breadcrumbs;

  actionButtons = actionButtons;
  getTeamProp(): string {
    return 'team';
  }
  getIdProp(): string {
    return 'id';
  }
  getNameProp(): string {
    return 'name';
  }
  getEntityType(): string {
    return 'parsingConfiguration';
  }

  getPageName(): string {
    return 'index-parsing-configuration';
  }
  onDelete(_: MeAgTableActionItemEvent<ParsingConfiguration>): void {}
}
