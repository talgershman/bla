import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeUserControlComponent} from '@mobileye/material/src/lib/components/form/user-control';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {of} from 'rxjs';

import {
  CreateJiraForDeepTeamDialogComponent,
  FLOW_OPTIONS_ENUM,
} from './create-jira-for-deep-team-dialog.component';

describe('CreateJiraForDeepTeamDialogComponent', () => {
  let spectator: Spectator<CreateJiraForDeepTeamDialogComponent>;
  let azureGraphService: SpyObject<MeAzureGraphService>;
  let fullStoryService: SpyObject<FullStoryService>;

  const createComponent = createComponentFactory({
    component: CreateJiraForDeepTeamDialogComponent,
    imports: [
      MatDialogModule,
      MatIconModule,
      MatButtonModule,
      MatRadioModule,
      FormsModule,
      MeControlListComponent,
      MeAutocompleteComponent,
      MatProgressSpinnerModule,
      MeInputComponent,
      MeUserControlComponent,
      MatSlideToggleModule,
      ReactiveFormsModule,
    ],
    mocks: [MeAzureGraphService, FullStoryService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    azureGraphService = spectator.inject<MeAzureGraphService>(MeAzureGraphService);
    fullStoryService = spectator.inject<FullStoryService>(FullStoryService);
    azureGraphService.getGroupsName.and.returnValue(of(['deep-fpa-objects']));
    fullStoryService.trackEvent.and.returnValue(null);
    spectator.component.currentUser = 'user52@mobileye.com';
    spectator.component.userTeams = [];
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onOptionChanged', () => {
    it('selected option new team - clear other fields', () => {
      spectator.detectChanges();

      spectator.component.onOptionChanged({value: FLOW_OPTIONS_ENUM.NEW});

      expect(spectator.component.form.controls.existingTeams.enabled).toBeFalse();
      expect(spectator.component.form.controls.newTeam.enabled).toBeTruthy();
    });

    it('selected option existing teams - clear other fields', () => {
      spectator.detectChanges();

      spectator.component.onOptionChanged({value: FLOW_OPTIONS_ENUM.EXISTING});

      expect(spectator.component.form.controls.existingTeams.enabled).toBeTruthy();
      expect(spectator.component.form.controls.newTeam.enabled).toBeFalse();
    });
  });

  describe('generateJiraAddress', () => {
    it('current user without any team, should create jira url', () => {
      spectator.component.currentUser = 'user52@mobileye.com';
      spectator.component.userTeams = [];
      spectator.detectChanges();
      spectator.component.form.controls.newTeam.setValue('deep-new-team');

      const url = spectator.component.generateJiraAddress();

      expect(url).toBe(
        'https://jira.mobileye.com/secure/CreateIssueDetails!init.jspa?pid=19742&issuetype=19401&assignee=adisa&components=44135&priority=4&summary=Assign+user+to+a+DEEP+team&description=Hello,%0A%0AI+would+like+to+assign+users+to+a+DEEP+team.%0A %0Auser: [~user52@mobileye.com] %0A&customfield_19684=new team: deep-new-team%0A',
      );
    });

    it('current user with team, should create jira url', () => {
      spectator.component.currentUser = 'user52@mobileye.com';
      spectator.component.userTeams = ['deep-other-team'];
      spectator.detectChanges();
      spectator.component.form.controls.users.clear();
      spectator.component.form.controls.users.push(new FormControl<string>('user1@mobileye.com'));
      spectator.component.form.controls.users.push(new FormControl<string>('user2@mobileye.com'));
      spectator.component.form.controls.newTeam.setValue('');
      spectator.component.form.controls.existingTeams.clear();
      spectator.component.form.controls.existingTeams.push(new FormControl<any>(null));
      spectator.component.form.controls.existingTeams.controls[0].setValue({
        id: 'user1',
        name: 'user1',
      });

      const url = spectator.component.generateJiraAddress();

      expect(url).toBe(
        'https://jira.mobileye.com/secure/CreateIssueDetails!init.jspa?pid=19742&issuetype=19401&assignee=adisa&components=44135&priority=4&summary=Assign+user+to+a+DEEP+team&description=Hello,%0A%0AI+would+like+to+assign+users+to+a+DEEP+team.%0A %0Ausers: [~user1], [~user2]%0A %0A&customfield_19684=existing teams: user1%0A',
      );
    });
  });
});
