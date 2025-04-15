import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioChange, MatRadioModule} from '@angular/material/radio';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {
  MeAutocompleteComponent,
  MeAutoCompleteOption,
} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeUserControlComponent} from '@mobileye/material/src/lib/components/form/user-control';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TEAMS_CHANNEL_URL} from 'deep-ui/shared/configs';
import _filter from 'lodash-es/filter';
import _isEqual from 'lodash-es/isEqual';
import _uniq from 'lodash-es/uniq';
import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

export enum FLOW_OPTIONS_ENUM {
  EXISTING = 'existing',
  NEW = 'new',
}

const JIRA_TICKET_URL = `https://jira.mobileye.com/secure/CreateIssueDetails!init.jspa?pid=19742&issuetype=[ISSUE_TYPE_PLACEHOLDER]&assignee=adisa&components=[COMPONENT_PLACEHOLDER]&priority=[PRIORITY_PLACEHOLDER]&summary=[SUMMARY_PLACEHOLDER]&description=[DESCRIPTION_PLACEHOLDER]`;

@UntilDestroy()
@Component({
  selector: 'de-create-jira-for-deep-team-dialog',
  templateUrl: './create-jira-for-deep-team-dialog.component.html',
  styleUrls: ['./create-jira-for-deep-team-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatRadioModule,
    ReactiveFormsModule,
    FormsModule,
    MeControlListComponent,
    MeAutocompleteComponent,
    MeInputComponent,
    MatSlideToggleModule,
    MeUserControlComponent,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    AsyncPipe,
  ],
})
export class CreateJiraForDeepTeamDialogComponent implements OnInit, OnDestroy {
  @Input()
  userTeams: Array<string>;

  @Input()
  currentUser: string;

  private fullStoryService = inject(FullStoryService);
  private fb = inject(FormBuilder);
  private azureGraphService = inject(MeAzureGraphService);

  TEAMS_CHANNEL_URL = TEAMS_CHANNEL_URL;

  selectOption: FLOW_OPTIONS_ENUM = FLOW_OPTIONS_ENUM.EXISTING;

  FLOW_OPTIONS_ENUM = FLOW_OPTIONS_ENUM;

  isNewTeamFlow = false;

  form = this.fb.group(
    {
      gitLabAccess: new FormControl<boolean>(false),
      existingTeams: new FormArray<FormControl<MeAutoCompleteOption>>([]),
      newTeam: new FormControl<string>(null, {
        validators: Validators.compose([
          (control: AbstractControl): ValidationErrors => {
            if (!control?.value) {
              return null;
            }
            if (this.knownDeepTeamNames().includes(control.value)) {
              return {invalid: 'This team all ready exists'};
            }
            const regExp = new RegExp(
              `^deep-([a-zA-Z]{1,})(-{1})([a-zA-Z]{1,})((-{1}([0-9a-zA-Z]{1,})){0,1})$`,
            );
            return regExp.test(control.value)
              ? null
              : {
                  invalid:
                    'Should be in format: deep-[department]-[team], for example: deep-algo-objd',
                };
          },
        ]),
      }),
      users: new FormArray<FormControl<string>>([]),
    },
    {
      validators: (
        formGroup: FormGroup<{
          gitLabAccess: FormControl<boolean>;
          existingTeams: FormArray<FormControl<string>>;
          newTeam: FormControl<string>;
          users: FormArray<FormControl<string>>;
        }>,
      ): ValidationErrors => {
        const users = formGroup.controls.users.value;
        const newTeam = formGroup.controls.newTeam.value;
        const existingTeams = formGroup.controls.existingTeams.value;
        if (this.userTeams?.length && (!users?.length || users[0] === null)) {
          return {invalid: 'Please insert affected users'};
        }
        if (!newTeam && (existingTeams?.length < 1 || existingTeams[0] === null)) {
          return {invalid: 'Please insert teams'};
        }
        return null;
      },
    },
  );

  teamsIds: WritableSignal<Array<string>> = signal([], {equal: _isEqual});

  knownDeepTeams: WritableSignal<Array<MeAutoCompleteOption>> = signal([], {equal: _isEqual});

  knownDeepTeamNames: Signal<Array<string>> = computed(() =>
    this.knownDeepTeams().map((team) => team.name),
  );

  validTeamOptions: Signal<Array<MeAutoCompleteOption>> = computed(() =>
    _filter(this.knownDeepTeams(), (option) => !this.teamsIds().includes(option.id)),
  );

  isReady = new BehaviorSubject<boolean>(false);

  isReady$ = this.isReady.asObservable();

  private readonly GROUP_BLACK_LIST = ['deep-admin', 'deep-algo-objd'];

  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this._registerEvents();
    this._setDeepTeams();
    this.addNewEmptyTeam();
    this.addNewUser();
    this.form.controls.newTeam.disable();
  }

  ngOnDestroy(): void {
    this.isReady.complete();
  }

  addNewEmptyTeam(): void {
    this.form.controls.existingTeams.push(new FormControl<MeAutoCompleteOption>(null));
  }

  addNewUser(): void {
    const validations = this.userTeams?.length ? Validators.required : null;
    this.form.controls.users.push(new FormControl<string>(null, {validators: validations}));
  }

  onOptionChanged(matRadioChange: Partial<MatRadioChange>): void {
    if (matRadioChange.value === FLOW_OPTIONS_ENUM.NEW) {
      this.form.controls.existingTeams.clear();
      this.addNewEmptyTeam();
      this.form.controls.existingTeams.disable();
      this.form.controls.newTeam.enable();
    } else if (matRadioChange.value === FLOW_OPTIONS_ENUM.EXISTING) {
      this.form.controls.newTeam.setValue('');
      this.form.controls.existingTeams.enable();
      this.form.controls.newTeam.disable();
    }
  }

  onDeleteItem(control: FormArray<any>, index: number): void {
    control.removeAt(index);
  }

  onCreateTicket(): void {
    const url = this.generateJiraAddress();

    window.open(url, '_blank');

    if (this.isNewTeamFlow) {
      this._sendNewTeamFSEvent();
    }

    this.dialog.closeAll();
  }

  private _sendNewTeamFSEvent(): void {
    const team = this.form.controls.newTeam.value;
    this.fullStoryService.trackEvent({
      name: 'UI - Assign users to DEEP',
      properties: {
        team: team,
      },
    });
  }

  generateJiraAddress(): string {
    const PRIORITY_MEDIUM = '4';
    const ISSUE_TYPE_USER_ON_BOARDING = '19401';
    const USER_FIELD = 'customfield_19684';
    const REQUIRE_GIT_ACCESS = 'customfield_26697=54988';
    const SUMMARY_TEXT = 'Assign+user+to+a+DEEP+team';
    const COMPONENT_USER_ON_BOARDING = '44135';
    const NEW_LINE = '%0A';
    const teams =
      this.form.controls.newTeam.value ||
      this.form.controls.existingTeams.value?.map((item) => item.id).join(', ');
    const users = this.form.controls.users.value
      ?.map((user) => {
        if (user?.includes('@')) {
          const shortUser = user.split('@')[0];
          return `[~${shortUser}]`;
        }
        return user;
      })
      .join(', ');
    const requireGitlab = this.form.controls.gitLabAccess.value;
    let descriptionText = `Hello,%0A%0AI+would+like+to+assign+users+to+a+DEEP+team.${NEW_LINE}`;
    descriptionText += ` ${NEW_LINE}`;
    if (users) {
      // does current user have a team
      if (this.userTeams.length === 0) {
        descriptionText = `${descriptionText}users: [~${this.currentUser}], ${users}${NEW_LINE}`;
      } else {
        descriptionText = `${descriptionText}users: ${users}${NEW_LINE}`;
      }
      descriptionText += ` ${NEW_LINE}`;
    } else {
      descriptionText = `${descriptionText}user: [~${this.currentUser}] ${NEW_LINE}`;
    }

    let url = JIRA_TICKET_URL.replace('[ISSUE_TYPE_PLACEHOLDER]', ISSUE_TYPE_USER_ON_BOARDING)
      .replace('[PRIORITY_PLACEHOLDER]', PRIORITY_MEDIUM)
      .replace('[SUMMARY_PLACEHOLDER]', SUMMARY_TEXT)
      .replace('[COMPONENT_PLACEHOLDER]', COMPONENT_USER_ON_BOARDING)
      .replace('[DESCRIPTION_PLACEHOLDER]', descriptionText);

    let teamsStr = '';
    if (teams) {
      if (this.form.controls.newTeam.value) {
        teamsStr = `new team: ${teams}${NEW_LINE}`;
        this.isNewTeamFlow = true;
      } else {
        teamsStr = `existing teams: ${teams}${NEW_LINE}`;
        this.isNewTeamFlow = false;
      }
      url += `&${USER_FIELD}=${teamsStr}`;
    }

    if (requireGitlab) {
      url += `&${REQUIRE_GIT_ACCESS}`;
    }

    return url;
  }

  private _registerEvents(): void {
    this.form.controls.existingTeams.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((value) => {
        this.teamsIds.set(_filter(value, (item) => !!item).map((item) => item.id));
      });
  }

  private _setDeepTeams(): void {
    this.azureGraphService.getGroupsName('deep-').subscribe((teams) => {
      const uniqTeams = _uniq(teams);
      this.knownDeepTeams.set(
        uniqTeams
          .filter((name) => !this.GROUP_BLACK_LIST.includes(name))
          .map((name) => {
            return {
              id: name,
              name,
            };
          }),
      );
      this.isReady.next(true);
    });
  }
}
