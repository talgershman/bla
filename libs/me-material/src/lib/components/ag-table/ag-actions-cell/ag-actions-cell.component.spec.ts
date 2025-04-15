import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgActionsCellComponent} from './ag-actions-cell.component';

describe('MeAgActionsCellComponent', () => {
  let spectator: Spectator<MeAgActionsCellComponent<any>>;

  const createComponent = createComponentFactory({
    component: MeAgActionsCellComponent,
    imports: [MatIconModule, MatButtonModule, MatMenuModule, MeTooltipDirective],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create the component', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeDefined();
  });
});
