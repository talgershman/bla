import {createDirectiveFactory, SpectatorDirective} from '@ngneat/spectator';

import {MeResizeObserver} from './resize-observer.directive';

describe('MeResizeObserver', () => {
  let spectator: SpectatorDirective<MeResizeObserver>;
  const createDirective = createDirectiveFactory({
    directive: MeResizeObserver,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createDirective(`'<input meResizeObserver />`);
  });

  it('should create component', () => {
    spectator.detectChanges();

    expect(spectator.directive).toBeDefined();
  });
});
