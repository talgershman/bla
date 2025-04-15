import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {AutocompleteChipsComponent} from '@mobileye/material/src/lib/components/form/autocomplete-chips';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {VersionDatasourceService} from 'deep-ui/shared/core';
import {Datasource, VersionDataSource} from 'deep-ui/shared/models';
import {
  getFakePerfectDatasource,
  getFakeQEAttributes,
  getFakeQueryJson,
  getFakeVersionDataSource,
} from 'deep-ui/shared/testing';

import {AggregationComponent} from './aggregation/aggregation.component';
import {GroupComponent} from './group/group.component';
import {QueryBuilderComponent} from './query-builder.component';
import {RuleComponent} from './rule/rule.component';
import {RuleService} from './rule/rule.service';

describe('QueryBuilderComponent', () => {
  let spectator: Spectator<QueryBuilderComponent>;
  let versions: Array<VersionDataSource>;
  let jsonQuery;

  const createComponent = createComponentFactory({
    component: QueryBuilderComponent,
    imports: [
      MeAutocompleteComponent,
      MatButtonModule,
      MatIconModule,
      MeInputComponent,
      MeSelectComponent,
      HintIconComponent,
      AutocompleteChipsComponent,
      MeFormControlChipsFieldComponent,
      HintIconComponent,
      MatCheckboxModule,
      ReactiveFormsModule,
      BrowserAnimationsModule,
      QueryBuilderComponent,
      RuleComponent,
      GroupComponent,
      AggregationComponent,
    ],
    providers: [RuleService, VersionDatasourceService],
    detectChanges: false,
  });

  beforeEach(() => {
    versions = [
      getFakeVersionDataSource(true, {userFacingVersion: '2'}),
      getFakeVersionDataSource(true, {userFacingVersion: '1'}),
    ];
    const perfectsDataSource: Datasource = getFakePerfectDatasource(true, {
      datasourceversionSet: versions,
      latestUserVersion: versions[1].userFacingVersion,
    }).fakeDataSource;

    perfectsDataSource.latestUserVersion = '2';

    spectator = createComponent();
    spectator.component.attributes = getFakeQEAttributes();
    spectator.setInput('dataSource', perfectsDataSource);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('isDataSourceLatestVersion', () => {
    it('is latest', () => {
      spectator.setInput('versionDataSource', versions[0]);

      const isLatest = spectator.component.isDataSourceLatestVersion();

      expect(isLatest).toBeTrue();
    });

    it('latest - no version', () => {
      spectator.setInput('versionDataSource', null);

      const isLatest = spectator.component.isDataSourceLatestVersion();

      expect(isLatest).toBeTrue();
    });

    it('not latest - version is not the latest', () => {
      spectator.setInput('versionDataSource', versions[1]);

      const isLatest = spectator.component.isDataSourceLatestVersion();

      expect(isLatest).toBeFalse();
    });
  });

  describe('onAddQueryClicked', () => {
    beforeEach(() => {
      jsonQuery = getFakeQueryJson(spectator.component.dataSource().id);
      spectator.setInput('versionDataSource', null);
      spyOn(spectator.component.addQueryClicked, 'emit');
      spyOn(spectator.component.updateQueryClicked, 'emit');
    });

    it('should fire addQuery event - with version data', async () => {
      spectator.setInput('versionDataSource', versions[1]);
      spectator.detectChanges();
      spectator.fixture.whenStable();

      // make the form valid
      spectator.component.conditionsForm = new FormGroup<any>({});
      spectator.detectChanges();
      spectator.fixture.whenStable();

      spectator.component.onAddQueryClicked();

      expect(spectator.component.addQueryClicked.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          dataSourceId: spectator.component.dataSource().id,
          dataSource: spectator.component.dataSource(),
          dataSourceVersionId: spectator.component.versionDataSource().id,
          userFacingVersion: spectator.component.versionDataSource().userFacingVersion,
          version: spectator.component.versionDataSource(),
        }),
      );
    });

    it('should fire addQuery event - without version data', async () => {
      spectator.detectChanges();
      spectator.fixture.whenStable();

      // make the form valid
      spectator.component.conditionsForm = new FormGroup<any>({});
      spectator.detectChanges();
      spectator.fixture.whenStable();

      spectator.component.onAddQueryClicked();

      expect(spectator.component.addQueryClicked.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          dataSourceId: spectator.component.dataSource().id,
          dataSource: spectator.component.dataSource(),
        }),
      );

      expect(spectator.component.addQueryClicked.emit).not.toHaveBeenCalledWith(
        jasmine.objectContaining({
          dataSourceVersionId: jasmine.anything(),
          userFacingVersion: jasmine.anything(),
          version: jasmine.anything(),
        }),
      );
    });

    it('should fire updateQuery event - latest version data', async () => {
      spectator.component.subQuery = jsonQuery[0];
      spectator.detectChanges();
      spectator.fixture.whenStable();

      // make the form valid
      spectator.component.conditionsForm = new FormGroup<any>({});
      spectator.detectChanges();
      spectator.fixture.whenStable();

      spectator.component.onAddQueryClicked();

      expect(spectator.component.updateQueryClicked.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          dataSourceId: spectator.component.dataSource().id,
          dataSource: spectator.component.dataSource(),
        }),
      );

      expect(spectator.component.updateQueryClicked.emit).not.toHaveBeenCalledWith(
        jasmine.objectContaining({
          dataSourceVersionId: jasmine.anything(),
          userFacingVersion: jasmine.anything(),
          version: jasmine.anything(),
        }),
      );
    });
  });
});
