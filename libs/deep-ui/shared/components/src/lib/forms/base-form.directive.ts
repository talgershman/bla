import {Directive, inject, Input, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UntilDestroy} from '@ngneat/until-destroy';
import {BaseTourHostComponent} from 'deep-ui/shared/components/src/lib/common';
import {DeepUtilService} from 'deep-ui/shared/core';
import _uniq from 'lodash-es/uniq';
import {BehaviorSubject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@UntilDestroy()
@Directive()
export abstract class BaseFormDirective extends BaseTourHostComponent implements OnInit {
  @Input({required: true})
  formMode: 'create' | 'edit' | 'override' | 'createFromId' | 'view';

  loadingSubscription = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  deepTeamOptions: string[] = [];

  teamControl: FormControl<string>;

  prevTourFormValue: any;

  protected deepUtilService = inject(DeepUtilService);

  override ngOnInit(): void {
    super.ngOnInit();
    this._setDeepTeamOptions();
  }

  abstract getTeamProp(): string;

  abstract getEntityType(): string;

  async startTour(): Promise<void> {}

  protected getDefaultTeam(): string {
    if (this.deepTeamOptions?.length === 1) {
      return this.deepTeamOptions[0];
    }
    return '';
  }

  private _setDeepTeamOptions(): void {
    const teams = this.deepUtilService.getCurrentUserTeams();
    if (this.formMode === 'create') {
      this.deepTeamOptions = teams;
      return;
    }
    const currentTeam = this[this.getEntityType()]?.[this.getTeamProp()]
      ? this[this.getEntityType()]?.[this.getTeamProp()]
      : null;
    this.deepTeamOptions = currentTeam ? _uniq([currentTeam].concat(teams)) : teams;
  }
}
