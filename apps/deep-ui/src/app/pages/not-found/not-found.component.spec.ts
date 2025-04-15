import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {NotFoundComponent} from './not-found.component';

describe('NotFoundComponent', () => {
  let spectator: Spectator<NotFoundComponent>;
  const createComponent = createComponentFactory({
    component: NotFoundComponent,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
