import {LoadSuccessParams} from '@ag-grid-community/core';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {inject} from '@angular/core/testing';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {ParsingConfigTableComponent} from 'deep-ui/shared/components/src/lib/tables/parsing-config-table';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {ParsingConfiguration} from 'deep-ui/shared/models';
import {getFakeParsingConfiguration} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {IndexParsingConfigurationComponent} from './index-parsing-configuration.component';

const mockParsingOne = getFakeParsingConfiguration(true, {createdByUsername: 'other@mobileye.com'});
const mockParsingTwo = {
  ...mockParsingOne,
  id: '123',
  name: 'dup',
  group: 'deep-other-team',
};

export const mockParsingConfigurationResponse: Array<ParsingConfiguration> = [
  getFakeParsingConfiguration(true, {createdByUsername: 'fakeUser@mobileye.com'}),
  getFakeParsingConfiguration(true, {createdByUsername: 'fakeUser@mobileye.com'}),
  mockParsingOne,
  mockParsingTwo,
];

describe('IndexParsingConfigurationComponent', () => {
  let spectator: Spectator<IndexParsingConfigurationComponent>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IndexParsingConfigurationComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      AgEntityListComponent,
      ParsingConfigTableComponent,
      MeAreYouSureDialogComponent,
      MeSelectComponent,
      MeAutocompleteComponent,
    ],
    mocks: [MeAzureGraphService, ParsingConfigurationService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    parsingConfigurationService.getLeanMulti.and.returnValue(of(mockParsingConfigurationResponse));
    parsingConfigurationService.getAgGridMulti.and.returnValue(
      of({
        rowData: mockParsingConfigurationResponse,
        rowCount: mockParsingConfigurationResponse.length,
      } as LoadSuccessParams),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onActionButtonClicked', () => {
    it('should handle create', inject([Router], (router: Router) => {
      spyOn(router, 'navigate');
      spectator.detectChanges();

      spectator.component.onActionButtonClicked('create');

      expect(router.navigate).toHaveBeenCalledWith(['./create'], jasmine.objectContaining({}));
    }));
  });

  describe('onSelectionChange', () => {
    it('should set selected parsing configuration', () => {
      const fakeParsingConfiguration = getFakeParsingConfiguration(true);
      spectator.detectChanges();

      spectator.component.onSelectionChanged([fakeParsingConfiguration]);

      expect(spectator.component.selected).toEqual([fakeParsingConfiguration]);
    });
  });

  describe('create configuration', () => {
    it('should click button and go to route', async () => {
      spyOn(spectator.component, 'onActionButtonClicked');
      spectator.detectChanges();

      // click create button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.create-button'});

      expect(spectator.component.onActionButtonClicked).toHaveBeenCalledWith('create');
    });
  });
});
