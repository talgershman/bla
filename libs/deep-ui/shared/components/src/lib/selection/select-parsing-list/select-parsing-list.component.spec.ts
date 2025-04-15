import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {getFakeParsingConfiguration} from 'deep-ui/shared/testing';

import {SelectParsingListComponent} from './select-parsing-list.component';

export const fakeParsingConfigs1 = [
  getFakeParsingConfiguration(true, {id: '11', folder: 'f1'}),
  getFakeParsingConfiguration(true, {id: '12', folder: 'f1'}),
  getFakeParsingConfiguration(true, {id: '13', folder: 'f1'}),
];

export const fakeParsingConfigs2 = [
  getFakeParsingConfiguration(true, {id: '30', folder: 'f2'}),
  getFakeParsingConfiguration(true, {id: '33', folder: 'f2'}),
  getFakeParsingConfiguration(true, {id: '34', folder: 'f1'}),
];

describe('SelectParsingListComponent', () => {
  let spectator: Spectator<SelectParsingListComponent>;

  const createComponent = createComponentFactory({
    component: SelectParsingListComponent,
    imports: [
      MeServerSideTableComponent,
      MeTooltipDirective,
      MatIconTestingModule,
      MatIconModule,
      MatButtonModule,
    ],
    mocks: [MeAzureGraphService, ParsingConfigurationService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
