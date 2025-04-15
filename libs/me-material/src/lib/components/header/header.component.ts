import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, Input, input, output} from '@angular/core';
import {MatBadgeModule} from '@angular/material/badge';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {RouterLink} from '@angular/router';
import {MeUser} from '@mobileye/material/src/lib/common';
import {MeAvatarComponent, MeAvatarItem} from '@mobileye/material/src/lib/components/avatar';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {BroadcastNameEnum, MeBroadcastService} from '@mobileye/material/src/lib/services/broadcast';
import {MeThemeManager} from '@mobileye/material/src/lib/services/theme-manager';
import {convertBlobToImgSrc} from '@mobileye/material/src/lib/utils';
import _filter from 'lodash-es/filter';
import {derivedAsync} from 'ngxtension/derived-async';
import {OnChange} from 'property-watch-decorator';
import {lastValueFrom} from 'rxjs';

import {MeLinkItem, MeTourItem} from './header-entities';

@Component({
  selector: 'me-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MeAvatarComponent,
    MatMenuModule,
    AsyncPipe,
    NgOptimizedImage,
    RouterLink,
    MeTooltipDirective,
  ],
})
export class MeHeaderComponent {
  user = input.required<MeUser>();

  @Input()
  userMenuItems: MeAvatarItem[];

  @Input()
  headerText: string;

  @Input()
  linksItems: Array<MeLinkItem>;

  @OnChange('_tourItemsChanged')
  @Input()
  tourItems: Array<MeTourItem>;

  @Input()
  isUpdateAvailable: boolean;

  @Input()
  errorWarningText: string;

  isAdminUser = input<boolean>();

  adminSettingsClicked = output<void>();

  public broadcastService = inject(MeBroadcastService);
  private azureGraphService = inject(MeAzureGraphService);
  private themeManager = inject(MeThemeManager);

  newToursCount: number;

  isDark$ = this.themeManager.isDark$;

  userPhoto = derivedAsync(async () => {
    const user = this.user();
    if (user) {
      try {
        const response: Blob | unknown = await lastValueFrom(this.azureGraphService.getPhoto());
        const photoURl = await convertBlobToImgSrc(response as Blob);
        return Promise.resolve(photoURl);
        //eslint-disable-next-line
      } catch (_) {
        return Promise.resolve(null);
      }
    } else {
      return Promise.resolve(null);
    }
  });

  changeTheme(): void {
    const currentTheme = this.themeManager.getStoredTheme();
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.themeManager.changeTheme(nextTheme);
  }

  onUpdateClick(): void {
    this._reloadOtherTabs();
    this.reloadCurrentPage();
  }

  reloadCurrentPage(): void {
    // stub it for unit tests
    location.reload();
  }

  private _tourItemsChanged(): void {
    if (!this.tourItems?.length) {
      this.newToursCount = 0;
      return;
    }
    const newAndUnWatchedTours =
      _filter(this.tourItems, (item: MeTourItem) => !item.watched && item.isNew) || [];
    this.newToursCount = newAndUnWatchedTours.length;
  }

  private _reloadOtherTabs(): void {
    this.broadcastService.postMessage(BroadcastNameEnum.New_Version_Indicator, {reload: true});
  }
}
