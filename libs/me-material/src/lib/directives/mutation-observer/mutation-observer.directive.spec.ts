import {createDirectiveFactory, SpectatorDirective} from '@ngneat/spectator';

import {MeMutationObserver} from './mutation-observer.directive';

describe('MeMutationObserver', () => {
  let spectator: SpectatorDirective<MeMutationObserver>;
  const createDirective = createDirectiveFactory({
    directive: MeMutationObserver,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createDirective(
      `'<input meMutationObserver (meDomChanges)="onDomChanges($event)" />`,
    );
  });

  it('should create component', () => {
    spectator.detectChanges();

    expect(spectator.directive).toBeDefined();
  });
});
