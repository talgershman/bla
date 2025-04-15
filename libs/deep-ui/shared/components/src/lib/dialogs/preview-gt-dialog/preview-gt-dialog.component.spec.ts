import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {PreviewGtDialogComponent} from './preview-gt-dialog.component';

describe('PreviewGtDialogComponent', () => {
  let spectator: Spectator<PreviewGtDialogComponent>;
  const createComponent = createComponentFactory({
    component: PreviewGtDialogComponent,
    imports: [],
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
});
