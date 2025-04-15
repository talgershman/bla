import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {TeamFilterStateTypes} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';

type IconTypes = 'people' | 'person';

@Component({
  selector: 'me-ag-table-team-filter',
  templateUrl: './ag-table-team-filter.component.html',
  styleUrls: ['./ag-table-team-filter.component.scss'],
  imports: [MatButtonModule, MeTooltipDirective, MatMenuModule, MatIconModule],
})
export class MeAgTableTeamFilterComponent implements OnInit {
  @Output()
  teamFilterClicked = new EventEmitter<TeamFilterStateTypes>();

  @Input('state')
  set setState(state: TeamFilterStateTypes) {
    this.currentState = state;
  }

  @Input('resetTeamFilter')
  set setResetTeamFilter(shouldEmitEvent: {shouldEmit: boolean}) {
    if (!shouldEmitEvent) {
      return;
    }
    this.currentState = 'none';
    this._setProps();
    if (shouldEmitEvent.shouldEmit) {
      this.teamFilterClicked.emit(this.currentState);
    }
  }

  @Input()
  componentId: string;

  @Input()
  ignoreSavingTeamFilterState: boolean;

  private userPreferencesService = inject(MeUserPreferencesService, {optional: true})!;

  currentIcon: IconTypes;

  highlightIcon: boolean;

  tooltip: string;

  currentState: TeamFilterStateTypes;

  ngOnInit(): void {
    this._restoreUserPreferences();
    this._setProps();
  }

  onFilterClicked(state: TeamFilterStateTypes): void {
    this.currentState = state;
    const data = this.userPreferencesService?.getComponentState(this.componentId);
    if (!this.ignoreSavingTeamFilterState) {
      this.userPreferencesService?.setComponentState(this.componentId, {
        ...data,
        teamFilterState: state,
      });
    }
    this._setProps();
    this.teamFilterClicked.emit(this.currentState);
  }

  private _restoreUserPreferences(): void {
    const data = this.userPreferencesService?.getComponentState(this.componentId);
    if (!!data?.teamFilterState && data.teamFilterState !== this.currentState) {
      this.teamFilterClicked.emit(data.teamFilterState);
      this.currentState = data.teamFilterState;
    }
  }

  private _setProps(): void {
    this.currentIcon = this._getIcon(this.currentState);
    this.highlightIcon = this._isHighlight(this.currentState);
    this.tooltip = this._getTooltip(this.currentState);
  }

  private _isHighlight(state: TeamFilterStateTypes): boolean {
    return state !== 'none';
  }

  private _getIcon(state: TeamFilterStateTypes): IconTypes {
    let icon: IconTypes;
    switch (state) {
      case 'me': {
        icon = 'person';
        break;
      }
      case 'my_teams':
      case 'none': {
        icon = 'people';
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = state;
        throw new Error(`Unhandled _getTooltip case: ${exhaustiveCheck}`);
      }
    }
    return icon;
  }

  private _getTooltip(state: TeamFilterStateTypes): string {
    let tooltip;
    switch (state) {
      case 'me': {
        tooltip = 'Filtered by my data';
        break;
      }
      case 'my_teams': {
        tooltip = 'Filtered by my teams data';
        break;
      }
      case 'none': {
        tooltip = 'Show all teams data';
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = state;
        throw new Error(`Unhandled _getTooltip case: ${exhaustiveCheck}`);
      }
    }
    return tooltip;
  }
}
