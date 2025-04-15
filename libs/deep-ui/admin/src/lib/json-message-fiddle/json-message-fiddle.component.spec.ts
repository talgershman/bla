import {KeyValuePipe} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeJsonMessageComponent} from '@mobileye/material/src/lib/components/json-message';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {JsonMessageFiddleComponent} from './json-message-fiddle.component';

describe('JsonMessageFiddleComponent', () => {
  let spectator: Spectator<JsonMessageFiddleComponent>;
  const createComponent = createComponentFactory({
    component: JsonMessageFiddleComponent,
    imports: [
      MeJsonMessageComponent,
      MeJsonEditorComponent,
      ReactiveFormsModule,
      MatButtonModule,
      KeyValuePipe,
    ],
    mocks: [],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
