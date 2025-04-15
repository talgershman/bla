import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgCustomHeaderComponent} from './ag-custom-header.component';
import createSpyObj = jasmine.createSpyObj;
import {Column, IHeaderParams} from '@ag-grid-community/core';
import {MatIconModule} from '@angular/material/icon';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';

describe('MeAgCustomHeaderComponent', () => {
  let spectator: Spectator<MeAgCustomHeaderComponent<any>>;

  const createComponent = createComponentFactory({
    component: MeAgCustomHeaderComponent,
    imports: [MatIconModule, HintIconComponent, MeTooltipDirective],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.params = createSpyObj<IHeaderParams>('IHeaderParams', ['showColumnMenu']);
    spectator.component.params.column = createSpyObj<Column>('Column', [
      'addEventListener',
      'removeEventListener',
    ]);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
