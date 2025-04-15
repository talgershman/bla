import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {MeButtonHarness, MeMenuItemHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {EtlService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {EtlTableComponent} from './etl-table.component';

describe('EtlTableComponent', () => {
  let spectator: Spectator<EtlTableComponent>;
  let etlService: SpyObject<EtlService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: EtlTableComponent,
    imports: [
      MeTooltipDirective,
      MatIconModule,
      MatIconTestingModule,
      MatButtonModule,
      MatDatepickerModule,
      MeServerSideTableComponent,
    ],
    mocks: [EtlService, MeAzureGraphService, MeUserPreferencesService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    etlService = spectator.inject(EtlService);
    etlService.getAgGridMulti.and.returnValue(
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

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {
        selector: '.filter-by-team-btn',
      });
      await MeMenuItemHarness.click(spectator.fixture, docLoader, {
        selector: '.filter-by-none',
      });
      spectator.fixture.detectChanges();

      expect(spectator.component.teamFilterState).toBe('none');
    });

    it('should my teams data', async () => {
      spectator.component.teamFilterState = 'none';
      spectator.detectChanges();

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

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

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

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
