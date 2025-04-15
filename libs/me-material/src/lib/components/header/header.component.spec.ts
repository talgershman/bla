import {MatBadgeModule} from '@angular/material/badge';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatToolbarModule} from '@angular/material/toolbar';
import {RouterTestingModule} from '@angular/router/testing';
import {MeAvatarComponent} from '@mobileye/material/src/lib/components/avatar';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeBroadcastService} from '@mobileye/material/src/lib/services/broadcast';
import {MeThemeManager} from '@mobileye/material/src/lib/services/theme-manager';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';

import {MeHeaderComponent} from './header.component';

describe('MeHeaderComponent', () => {
  let spectator: Spectator<MeHeaderComponent>;
  let broadcastService: SpyObject<MeBroadcastService>;

  const createComponent = createComponentFactory({
    component: MeHeaderComponent,
    imports: [
      MatBadgeModule,
      MatIconModule,
      MatIconTestingModule,
      MatDividerModule,
      MatToolbarModule,
      MatButtonModule,
      MeAvatarComponent,
      MeHeaderComponent,
      RouterTestingModule,
      MeTooltipDirective,
    ],
    mocks: [MeBroadcastService, MeAzureGraphService, MeThemeManager],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    broadcastService = spectator.inject(MeBroadcastService);
    spectator.component.reloadCurrentPage = jasmine.createSpy();
    spectator.setInput('user', {name: 'Moshe', userName: 'Koko'});
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('onUpdateClick', () => {
    spectator.detectChanges();
    broadcastService.postMessage.and.returnValue(null);

    spectator.component.onUpdateClick();
    const countCreateBroadcast = broadcastService.postMessage.calls.count();

    expect(countCreateBroadcast).toEqual(1);
  });
});
