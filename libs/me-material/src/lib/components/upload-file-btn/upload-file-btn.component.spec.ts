import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeUploadFileBtnComponent} from './upload-file-btn.component';

describe('MeUploadFileBtnComponent', () => {
  let spectator: Spectator<MeUploadFileBtnComponent>;

  const createComponent = createComponentFactory({
    component: MeUploadFileBtnComponent,
    imports: [],
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
