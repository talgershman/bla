import {CdkScrollableModule} from '@angular/cdk/scrolling';
import {FormControl, FormsModule, NgControl} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatInputModule} from '@angular/material/input';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeParametersListComponent} from './parameters-list.component';
import {MeParametersListItem, MeParametersListItemType} from './parameters-list-entities';

describe('MeParametersListComponent', () => {
  let spectator: Spectator<MeParametersListComponent>;

  const createComponent = createComponentFactory({
    component: MeParametersListComponent,
    imports: [
      CdkScrollableModule,
      MatIconModule,
      MatIconTestingModule,
      FormsModule,
      MatInputModule,
    ],
    providers: [{provide: NgControl, useValue: new FormControl()}],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    const items: MeParametersListItem[] = [
      {
        key: 'key1',
        type: MeParametersListItemType.KEY_VALUE,
        value: '123',
      },
      {
        key: 'key2',
        type: MeParametersListItemType.SINGLE,
      },
      {
        key: 'key3',
        type: MeParametersListItemType.SINGLE,
      },
      {
        key: 'key4',
        type: MeParametersListItemType.KEY_VALUE,
        value: '12453',
      },
    ];
    spectator.component.items = items;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onSingleParamClickedAdd', () => {
    it('should create a new row of type single', () => {
      spyOn(spectator.component, 'onChange');
      spyOn(spectator.component, 'onTouched');
      const beforeLength = spectator.component.items.length;
      const expected: MeParametersListItem = {
        key: '',
        type: MeParametersListItemType.SINGLE,
      };
      spectator.detectChanges();

      spectator.component.onSingleParamClickedAdd();

      const afterLength = spectator.component.items.length;

      expect(spectator.component.items.length).toBe(beforeLength + 1);
      expect(spectator.component.items[afterLength - 1]).toEqual(expected);
      expect(spectator.component.onChange).toHaveBeenCalled();
      expect(spectator.component.onTouched).toHaveBeenCalled();
    });
  });

  describe('onKeyValueParamClickedAdd', () => {
    it('should create a new row of type key value', () => {
      spyOn(spectator.component, 'onChange');
      spyOn(spectator.component, 'onTouched');
      const beforeLength = spectator.component.items.length;
      const expected: MeParametersListItem = {
        key: '',
        value: '',
        type: MeParametersListItemType.KEY_VALUE,
      };
      spectator.detectChanges();

      spectator.component.onKeyValueParamClickedAdd();
      spectator.detectChanges();
      const afterLength = spectator.component.items.length;

      expect(spectator.component.items.length).toBe(beforeLength + 1);
      expect(spectator.component.items[afterLength - 1]).toEqual(expected);
      expect(spectator.component.onChange).toHaveBeenCalled();
      expect(spectator.component.onTouched).toHaveBeenCalled();
    });
  });

  describe('onDeleteItem', () => {
    it('should create a new row of type key value', () => {
      spyOn(spectator.component, 'onChange');
      spyOn(spectator.component, 'onTouched');
      const beforeLength = spectator.component.items.length;

      spectator.detectChanges();

      spectator.component.onDeleteItem(1);

      expect(spectator.component.items.length).toBe(beforeLength - 1);
      expect(spectator.component.onChange).toHaveBeenCalled();
      expect(spectator.component.onTouched).toHaveBeenCalled();
    });
  });

  describe('updateListItem', () => {
    it('should update text', () => {
      spectator.detectChanges();
      const mockInputElem = document.createElement('input');
      mockInputElem.value = '1234';

      spectator.component.updateListItem(1, mockInputElem, 'key');

      expect(spectator.component.items[1].key).toBe('1234');
    });

    it('should trim text', () => {
      spectator.detectChanges();
      const mockInputElem = document.createElement('input');
      mockInputElem.value = '  1234';

      spectator.component.updateListItem(1, mockInputElem, 'key');

      expect(spectator.component.items[1].key).toBe('1234');
    });
  });

  describe('updateListItems', () => {
    it('should update items by its correct type', () => {
      spectator.detectChanges();
      spectator.component.textAreaElem.getFocusHTMLElement().value =
        'ALGO_OBJ: bubbleEnabled=true ALGO_OBJ_PARK: enabled=true forceRunRSPAMapping=true dumpNssDepthPext=true : pext-config=/mobileye/algo_Objects01/jonathanga/configs/Nss_Depth.config : GVP: brain=PC : -sallow-using-bin itrk-cfg=/homes/yadidl/work/configs/vd3d.cfg : Display: enabled=false : -sframe-verbose : FS: --outDir . : Logging: bml=true FS: blockList=/dev/,/var/,/proc/,.raw : pext-config=/mobileye/algo_Objects01/jonathanga/configs/Nss_Depth.config';

      spectator.component.onTextAreaBlurred();

      expect(spectator.component.items.length).toBe(6);
      expect(spectator.component.items[2].type).toBe(MeParametersListItemType.KEY_VALUE);
      expect(spectator.component.items[2].key).toBe('forceRunRSPAMapping');
      expect(spectator.component.items[2].value).toBe('true');
      expect(spectator.component.items[4].type).toBe(MeParametersListItemType.SINGLE);
      expect(spectator.component.items[4].key).toBe(
        'itrk-cfg=/homes/yadidl/work/configs/vd3d.cfg : Display: enabled=false : -sframe-verbose : FS: --outDir . : Logging: bml=true'
      );
    });
  });
});
