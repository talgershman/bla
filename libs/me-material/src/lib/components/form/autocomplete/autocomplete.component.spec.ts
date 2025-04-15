import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {AsyncPipe, NgClass} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {MatAutocompleteHarness} from '@angular/material/autocomplete/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeHighlightTextDirective} from '@mobileye/material/src/lib/directives/highlight-text';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {getFakeMouseEvent} from '../../../testing/utils';
import {MeAutocompleteComponent} from './autocomplete.component';
import {MeAutoCompleteOption} from './autocomplete-entites';
import createSpyObj = jasmine.createSpyObj;
import {discardPeriodicTasks, fakeAsync, flush} from '@angular/core/testing';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {NgxMaskDirective} from 'ngx-mask';

describe('MeAutocompleteComponent', () => {
  let spectator: Spectator<MeAutocompleteComponent>;
  let options: MeAutoCompleteOption[];

  const createComponent = createComponentFactory({
    component: MeAutocompleteComponent,
    imports: [
      HintIconComponent,
      MatFormFieldModule,
      MatInputModule,
      ReactiveFormsModule,
      MatAutocompleteModule,
      MatButtonModule,
      MatIconModule,
      MatOptionModule,
      MeHighlightTextDirective,
      AsyncPipe,
      NgClass,
      NgxMaskDirective,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    options = [
      {
        id: '1',
        name: 'first',
      },
      {
        id: '2',
        name: 'second',
      },
      {
        id: '3',
        name: 'third',
      },
    ];
    spectator.component.options = options;
    spectator.component.placeholder = 'select';
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onClearTermClicked', () => {
    it('should call open panel & reset value', () => {
      spyOn(spectator.component.innerController, 'setValue');
      spyOn(spectator.component, 'onValueChange');
      const trigger = createSpyObj('trigger', ['openPanel']) as MatAutocompleteTrigger;
      const event = getFakeMouseEvent();
      spectator.detectChanges();

      spectator.component.onClearTermClicked(event, trigger);

      expect(spectator.component.innerController.setValue).toHaveBeenCalledWith(null);
      expect(spectator.component.onValueChange).toHaveBeenCalledWith(null);
      expect(trigger.openPanel).toHaveBeenCalled();
    });
  });

  describe('onSearchEnterKey', () => {
    it('should not set control if multi options', async () => {
      spyOn(spectator.component.innerController, 'setValue');
      const trigger = createSpyObj('trigger', ['closePanel']) as MatAutocompleteTrigger;
      const event = getFakeMouseEvent();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const autocompleteElem = await loader.getHarness(MatAutocompleteHarness.with({}));
      const elem = await autocompleteElem.host();
      await elem.click();
      spectator.component.onSearchEnterKey(event, trigger);

      expect(spectator.component.innerController.setValue).toHaveBeenCalledTimes(1);
      expect(trigger.closePanel).toHaveBeenCalledTimes(0);
    });
  });

  describe('onValueChange', () => {
    it('should emit event', fakeAsync(() => {
      spyOn(spectator.component.selectionChanged, 'emit');
      spectator.detectChanges();
      spectator.fixture.whenStable();
      const eventMock = {} as MatAutocompleteSelectedEvent;
      spectator.component.onValueChange(eventMock);
      spectator.detectChanges();
      spectator.fixture.whenStable();
      flush();
      discardPeriodicTasks();

      expect(spectator.component.selectionChanged.emit).toHaveBeenCalledWith(null);
    }));
  });

  describe('filtering options', () => {
    it('should filter all options', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const autocompleteElem = await loader.getHarness(MatAutocompleteHarness.with({}));

      const elem = await autocompleteElem.host();
      await elem.click();
      await autocompleteElem.enterText('not found');
      const isOpen = await autocompleteElem.isOpen();

      expect(isOpen).toBeFalse();
    });

    it('should filter some options', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const autocompleteElem = await loader.getHarness(MatAutocompleteHarness.with({}));
      await autocompleteElem.enterText('second');

      const optionsElems = await autocompleteElem.getOptions();

      expect(optionsElems.length).toEqual(1);
    });
  });
});
