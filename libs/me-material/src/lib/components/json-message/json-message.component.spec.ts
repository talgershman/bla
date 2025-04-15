import {MatSnackBar} from '@angular/material/snack-bar';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {provideNgxMask} from 'ngx-mask';

import {MeJsonMessageComponent} from './json-message.component';

describe('MeJsonMessageComponent', () => {
  let spectator: Spectator<MeJsonMessageComponent>;

  const createComponent = createComponentFactory({
    component: MeJsonMessageComponent,
    imports: [],
    providers: [MeSnackbarService, MatSnackBar, provideNgxMask()],
    mocks: [],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('hideParentKey', () => {
    it('should hide', () => {
      spectator.component.hideParentKey = true;
      spectator.component.msg = {
        toHide: {
          show1: true,
          show2: '123',
        },
      };

      spectator.detectChanges();
      spectator.fixture.whenStable();

      expect(spectator.component.copyMsg).toEqual({
        show1: true,
        show2: '123',
      });
    });

    it('should hide - with config', () => {
      spectator.component.hideParentKey = true;
      spectator.component.msg = {
        uiConfigs: {} as any,
        toHide: {
          show1: true,
          show2: '123',
        },
      };

      spectator.detectChanges();
      spectator.fixture.whenStable();

      expect(spectator.component.copyMsg).toEqual({
        show1: true,
        show2: '123',
      });
    });

    it('should not hide', () => {
      spectator.component.msg = {
        siblingOne: 123,
        siblingTwo: {
          show1: true,
          show2: '123',
        },
      };

      spectator.component.hideParentKey = true;

      spectator.detectChanges();
      spectator.fixture.whenStable();

      expect(spectator.component.copyMsg).toEqual({
        siblingOne: 123,
        siblingTwo: {
          show1: true,
          show2: '123',
        },
      });
    });
  });
});
