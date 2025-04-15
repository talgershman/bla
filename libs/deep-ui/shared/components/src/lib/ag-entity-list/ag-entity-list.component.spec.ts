import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {AgEntityListComponent} from './ag-entity-list.component';
import {EntityListActionButton} from './entity-list-entites';

const buttons: EntityListActionButton<any>[] = [
  {
    label: 'button 1',
    id: 'button 1',
    icon: 'edit',
    isPrimary: false,
  },
  {
    label: 'button 2',
    id: 'button 2',
    icon: 'add',
    isPrimary: true,
  },
];

describe('AgEntityListComponent', () => {
  let spectator: Spectator<AgEntityListComponent<any>>;
  const createComponent = createComponentFactory({
    component: AgEntityListComponent,
    imports: [MatButtonModule, MeTooltipDirective, MatIconModule, MePortalSrcDirective],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    spectator.component.setActionButtons = buttons;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
