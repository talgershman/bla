import {DragDropModule} from '@angular/cdk/drag-drop';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeDragDropListComponent} from './drag-drop-list.component';

describe('MeDragDropListComponent', () => {
  let spectator: Spectator<MeDragDropListComponent>;

  const createComponent = createComponentFactory({
    component: MeDragDropListComponent,
    providers: [
      {
        provide: NG_VALUE_ACCESSOR,
        useExisting: MeDragDropListComponent,
        multi: true,
      },
    ],
    imports: [MatIconModule, MatIconTestingModule, DragDropModule],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.items = ['item1', 'item2', 'item3', 'item4'];
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onDeleteItem', () => {
    it('should remove and emit new value', () => {
      const beforeLength = spectator.component.items.length;
      spyOn(spectator.component, 'onChange');
      spyOn(spectator.component, 'onTouched');
      spectator.detectChanges();

      spectator.component.onDeleteItem(1);

      expect(spectator.component.items.length).toBe(beforeLength - 1);
      expect(spectator.component.onChange).toHaveBeenCalled();
      expect(spectator.component.onTouched).toHaveBeenCalled();
    });
  });

  describe('onClickedAdd', () => {
    it('should create a empty row', async () => {
      const beforeLength = spectator.component.items.length;
      spectator.detectChanges();
      spyOn(spectator.component, 'onChange');
      spyOn(spectator.component, 'onTouched');

      spectator.component.onClickedAdd();

      const afterLength = spectator.component.items.length;
      await spectator.fixture.whenStable();

      expect(spectator.component.items.length).toBe(beforeLength + 1);
      expect(spectator.component.items[afterLength - 1]).toBe('');
      expect(spectator.component.onChange).toHaveBeenCalled();
      expect(spectator.component.onTouched).toHaveBeenCalled();
    });
  });

  describe('updateListItem', () => {
    it('should create a empty row', () => {
      spyOn(spectator.component, 'onChange');
      spyOn(spectator.component, 'onTouched');
      spectator.detectChanges();

      const mockInputElem = document.createElement('input');
      mockInputElem.value = '1234';

      const event: any = {target: {value: '1234'}};
      spectator.component.updateListItem(event, 1);

      expect(spectator.component.items[1]).toBe('1234');
      expect(spectator.component.onChange).toHaveBeenCalled();
      expect(spectator.component.onTouched).toHaveBeenCalled();
    });
  });
});
