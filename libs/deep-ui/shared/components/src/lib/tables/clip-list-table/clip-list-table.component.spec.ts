import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {MeButtonHarness, MeMenuItemHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {ClipListService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {ClipListTableComponent} from './clip-list-table.component';

describe('ClipListTableComponent', () => {
  let spectator: Spectator<ClipListTableComponent>;
  let clipListService: SpyObject<ClipListService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ClipListTableComponent,
    imports: [
      MatButtonModule,
      MatIconModule,
      MatDatepickerModule,
      MeTooltipDirective,
      MeServerSideTableComponent,
      MatIconTestingModule,
    ],
    mocks: [MatDialog, ClipListService, MeUserPreferencesService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    clipListService = spectator.inject(ClipListService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    clipListService.getAgGridMulti.and.returnValue(
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

    it('should my teams data', async () => {
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
