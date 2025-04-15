import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {MeButtonHarness, MeMenuItemHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasetService} from 'deep-ui/shared/core';
import {ToastrService} from 'ngx-toastr';
import {of} from 'rxjs';

import {DatasetTableComponent} from './dataset-table.component';

describe('DatasetTableComponent', () => {
  let spectator: Spectator<DatasetTableComponent>;
  let datasetService: SpyObject<DatasetService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DatasetTableComponent,
    imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
    mocks: [DatasetService, MeAzureGraphService, ToastrService, MeUserPreferencesService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    datasetService = spectator.inject(DatasetService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    datasetService.getAgGridMulti.and.returnValue(
      of({
        rowData: [],
        rowCount: 0,
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('deep teams', () => {
    it('should show all data', async () => {
      spectator.component.teamFilterState = 'my_teams';
      spectator.detectChanges();

      await MeButtonHarness.click(spectator.fixture, loader, {
        selector: '.filter-by-team-btn',
      });
      await MeMenuItemHarness.click(spectator.fixture, docLoader, {
        selector: '.filter-by-none',
      });
      spectator.fixture.detectChanges();

      expect(spectator.component.teamFilterState).toBe('none');
    });

    it('should show my teams data', async () => {
      spectator.component.teamFilterState = 'none';
      spectator.detectChanges();

      await MeButtonHarness.click(spectator.fixture, loader, {
        selector: '.filter-by-team-btn',
      });
      await MeMenuItemHarness.click(spectator.fixture, docLoader, {
        selector: '.filter-by-my-teams',
      });

      expect(spectator.component.teamFilterState).toBe('my_teams');
    });

    it('should show my data only', async () => {
      spectator.component.teamFilterState = 'none';
      spectator.detectChanges();

      await MeButtonHarness.click(spectator.fixture, loader, {
        selector: '.filter-by-team-btn',
      });
      await MeMenuItemHarness.click(spectator.fixture, docLoader, {
        selector: '.filter-by-my-data',
      });
      spectator.detectChanges();

      expect(spectator.component.teamFilterState).toBe('me');
    });
  });
});
