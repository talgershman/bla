import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgTemplateRendererComponent} from './ag-template-renderer.component';
import createSpyObj = jasmine.createSpyObj;
import {Column} from '@ag-grid-community/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';

describe('MeAgTemplateRendererComponent', () => {
  let spectator: Spectator<MeAgTemplateRendererComponent<any>>;

  const createComponent = createComponentFactory({
    component: MeAgTemplateRendererComponent,
    imports: [MeTooltipDirective, MatButtonModule, MatIconModule],
    mocks: [MeSnackbarService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.templateContext = {$implicit: '', params: {valueFormatted: 'val'} as any};
    spectator.component.params = {
      column: createSpyObj<Column>('Column', ['addEventListener']),
    } as any;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
