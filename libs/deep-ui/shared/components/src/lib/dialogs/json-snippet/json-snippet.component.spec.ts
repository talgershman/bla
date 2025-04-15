import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {JsonSnippetComponent} from './json-snippet.component';

describe('JsonSnippetComponent', () => {
  let spectator: Spectator<JsonSnippetComponent>;
  const createComponent = createComponentFactory({
    component: JsonSnippetComponent,
    imports: [
      MatIconModule,
      MatButtonModule,
      MatSlideToggleModule,
      MeJsonEditorComponent,
      ReactiveFormsModule,
    ],
    mocks: [MatDialogRef, MeUserPreferencesService],
    componentProviders: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          k: 'some data',
        },
      },
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('show correct JSON data', () => {
    it('show data', () => {
      spectator.detectChanges();

      expect(spectator.component.jsonControl.value).toEqual(spectator.component.data);
    });

    it('show minData', () => {
      spectator.component.extraDataToggleName = 'toggle name';
      spectator.component.minData = {
        k: 'some data 2',
      };
      spectator.detectChanges();

      expect(spectator.component.jsonControl.value).toEqual(spectator.component.minData);
    });
  });
});
