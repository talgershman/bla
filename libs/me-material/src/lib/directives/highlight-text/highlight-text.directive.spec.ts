import {fakeAsync, flush} from '@angular/core/testing';
import {createDirectiveFactory, SpectatorDirective} from '@ngneat/spectator';

import {getElementBySelector} from '../../testing/utils';
import {MeHighlightTextDirective} from './highlight-text.directive';

describe('MeHighlightTextDirective', () => {
  let spectator: SpectatorDirective<MeHighlightTextDirective>;
  const createDirective = createDirectiveFactory({
    directive: MeHighlightTextDirective,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createDirective(
      `'<span meHighlightText search="with (brackets) an" classToApply="some-class" text="some words with (brackets) and stuff"></span>'`
    );
  });

  it('should create component', () => {
    spectator.detectChanges();

    expect(spectator.directive).toBeDefined();
  });

  it('should highlight-text the correct text', fakeAsync(() => {
    spectator.detectChanges();
    flush();
    const elem = getElementBySelector(spectator.fixture, 'span').nativeElement;

    expect(elem.innerHTML).toBe(
      `some words <span class="some-class">with (brackets) an</span>d stuff`
    );
  }));
});
