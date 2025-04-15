import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {IshowUrlDialogComponent} from './ishow-url-dialog.component';

describe('IshowUrlDialogComponent', () => {
  let spectator: Spectator<IshowUrlDialogComponent>;
  const createComponent = createComponentFactory({
    component: IshowUrlDialogComponent,
    imports: [MatButtonModule, MatIconModule, MatDialogModule, MeTextareaComponent, FormsModule],
    mocks: [MeSnackbarService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.ishowUrl =
      'deep://perfects/data-source-uuid=f5ccc670-cc4a-4323-acac-3355df861f11/env=dev1/?name=test clissify perfect by rq';
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('shortUrl', () => {
    it('there is no short url', () => {
      spectator.component.ishowUrl =
        'deep://perfects/data-source-uuid=f5ccc670-cc4a-4323-acac-3355df861f11/env=dev1/';
      spectator.detectChanges();

      expect(spectator.component.shortUrl).toBe(undefined);
    });

    it('there is a short url', () => {
      spectator.detectChanges();

      expect(spectator.component.shortUrl).toBe(
        'deep://perfects/data-source-uuid=f5ccc670-cc4a-4323-acac-3355df861f11/env=dev1/'
      );
    });
  });
});
