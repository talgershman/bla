import {MatRadioModule} from '@angular/material/radio';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {EtlJobFlowsEnum} from 'deep-ui/shared/models';

import {SelectFlowComponent} from './select-flow.component';

describe('SelectFlowComponent', () => {
  let spectator: Spectator<SelectFlowComponent>;

  const createComponent = createComponentFactory({
    component: SelectFlowComponent,
    imports: [MatRadioModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onFlowSelected', () => {
    it('should emit flow changed', () => {
      spyOn(spectator.component.flowChanged, 'emit');
      const selectedButton = spectator.component.buttons[1];

      spectator.detectChanges();
      spectator.component.onFlowSelected(selectedButton);

      expect(spectator.component.flowChanged.emit).toHaveBeenCalledWith(selectedButton.id);
    });

    it('should not emit flow changed', () => {
      spyOn(spectator.component.flowChanged, 'emit');
      const selectedButton = spectator.component.buttons[1];
      spectator.component.selected = selectedButton.id as EtlJobFlowsEnum;

      spectator.detectChanges();
      spectator.component.onFlowSelected(selectedButton);

      expect(spectator.component.flowChanged.emit).toHaveBeenCalledTimes(0);
    });
  });
});
