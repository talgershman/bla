import {MatSnackBarModule} from '@angular/material/snack-bar';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeSnackbarService} from './snackbar.service';

describe('MeSnackbarService', () => {
  let spectator: SpectatorService<MeSnackbarService>;
  const createService = createServiceFactory({
    service: MeSnackbarService,
    imports: [MatSnackBarModule],
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
