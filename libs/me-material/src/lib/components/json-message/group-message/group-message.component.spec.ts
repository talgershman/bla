import {CdkAccordionModule} from '@angular/cdk/accordion';
import {NgClass, NgStyle, NgTemplateOutlet} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MeJsonMessageService} from '@mobileye/material/src/lib/components/json-message/json-message.service';
import {MeLineMessageComponent} from '@mobileye/material/src/lib/components/json-message/line-message/line-message.component';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeGroupMessageComponent} from './group-message.component';

describe('MeGroupMessageComponent', () => {
  let spectator: Spectator<MeGroupMessageComponent>;

  const createComponent = createComponentFactory({
    component: MeGroupMessageComponent,
    imports: [
      MeLineMessageComponent,
      CdkAccordionModule,
      NgStyle,
      MeTooltipDirective,
      NgClass,
      MatIconModule,
      MatButtonModule,
      MatMenuModule,
      NgTemplateOutlet,
    ],
    providers: [MeJsonMessageService],
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
