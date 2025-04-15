import {Component} from '@angular/core';
import {getElementBySelector} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DeepUtilService} from 'deep-ui/shared/core';

import {IfUserTeamDirective} from './if-user-team.directive';

@Component({
  template: ` <div *ifUserTeam="['deep-group-2']">TEST</div> `,
  imports: [IfUserTeamDirective],
})
class TestComponent {}

describe('IfUserTeamDirective', () => {
  let spectator: Spectator<TestComponent>;
  let deepUtilService: SpyObject<DeepUtilService>;

  const createComponent = createComponentFactory({
    component: TestComponent,
    imports: [TestComponent],
    mocks: [DeepUtilService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    deepUtilService = spectator.inject(DeepUtilService);
  });

  it('should show - admin', async () => {
    deepUtilService.isAdminUser.and.returnValue(true);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const element = getElementBySelector(spectator.fixture, 'div');

    expect(element).toBeVisible();
  });

  it('should show - team exits', async () => {
    deepUtilService.isAdminUser.and.returnValue(false);
    deepUtilService.getCurrentUserTeams.and.returnValue(['deep-group-1', 'deep-group-2']);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const element = getElementBySelector(spectator.fixture, 'div');

    expect(element).toBeVisible();
  });

  it('should hide', async () => {
    deepUtilService.isAdminUser.and.returnValue(false);
    deepUtilService.getCurrentUserTeams.and.returnValue(['deep-group-1']);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const element = getElementBySelector(spectator.fixture, 'div');

    expect(element).not.toBeVisible();
  });
});
