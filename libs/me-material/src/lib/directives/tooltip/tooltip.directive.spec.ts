import {
  MeTooltipService,
  MeTooltipStorageService,
  MeTooltipViewService,
} from '@mobileye/material/src/lib/directives/tooltip/services';
import {createDirectiveFactory, SpectatorDirective} from '@ngneat/spectator';

import {MeTooltipDirective} from './tooltip.directive';

describe('MeTooltipDirective', () => {
  let spectator: SpectatorDirective<MeTooltipDirective>;

  const providers = [MeTooltipService, MeTooltipViewService, MeTooltipStorageService];

  const createDirective = createDirectiveFactory({
    directive: MeTooltipDirective,
    imports: [],
    providers,
    detectChanges: false,
  });

  it('should NOT init tooltip', async () => {
    spectator = createDirective(
      `
        <div class="test">
          <button
            class="test__btn"
            [meTooltip]="null"
            [meTooltipProps]="{
              appendTo: 'parent',
              trigger: 'click'
            }"
          >
            Element with tooltip
          </button>
        </div>
        `,
      {
        hostProps: {
          changeDetection: false,
        },
      },
    );

    spectator.detectChanges();
    spectator.dispatchMouseEvent(spectator.query('.test__btn'), 'click');
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query('.tippy-content')).toBeNull();
  });

  it('should show tooltip on hover', async () => {
    spectator = createDirective(
      `
        <div class="test">
          <button
            class="test__btn"
            meTooltip="Tooltip content"
            [meTooltipProps]="{
              appendTo: 'parent'
            }"
          >
            Element with tooltip
          </button>
        </div>
        `,
      {
        hostProps: {
          changeDetection: false,
        },
      },
    );

    spectator.detectChanges();
    spectator.dispatchMouseEvent(spectator.query('.test__btn'), 'mouseenter');
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query('.tippy-content')).toBeTruthy();
  });

  it('should NOT show tooltip on hover', async () => {
    spectator = createDirective(
      `
        <div class="test">
          <button
            class="test__btn"
            meTooltip="Tooltip content"
            [meTooltipDisabled]="true"
            [meTooltipProps]="{
              appendTo: 'parent'
            }"
          >
            Element with tooltip
          </button>
        </div>
        `,
      {
        hostProps: {
          changeDetection: false,
        },
      },
    );

    spectator.detectChanges();
    spectator.dispatchMouseEvent(spectator.query('.test__btn'), 'mouseenter');
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query('.tippy-content')).toBeNull();
  });
});
