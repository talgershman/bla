import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeChipsGroupButtonsComponent} from './chips-group-buttons.component';

describe('MeChipsGroupButtonsComponent', () => {
  let spectator: Spectator<MeChipsGroupButtonsComponent>;

  const createComponent = createComponentFactory({
    component: MeChipsGroupButtonsComponent,
    imports: [MatChipListbox, MatChipOption],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent({
      props: {
        options: [
          {id: 'option-1', label: 'option 1'},
          {id: 'option-2', label: 'option 2'},
        ],
        selectedOption: 'option-2',
      },
    });
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
