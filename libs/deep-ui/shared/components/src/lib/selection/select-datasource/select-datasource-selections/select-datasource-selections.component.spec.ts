import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {
  DatasourceSelectionChipData,
  SelectDatasourceSelectionsComponent,
} from './select-datasource-selections.component';

describe('SelectDatasourceSelectionsComponent', () => {
  let spectator: Spectator<SelectDatasourceSelectionsComponent>;
  const createComponent = createComponentFactory({
    component: SelectDatasourceSelectionsComponent,
    imports: [MatChipsModule, MatIconModule, MeTooltipDirective],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should display chips correctly', () => {
    const testData: DatasourceSelectionChipData[] = [
      {
        name: 'Item1',
        typeName: 'Type1',
        type: 'type',
        rowId: 1,
        level: 0,
        userFacingVersion: 'latest',
      },
      {
        name: 'Item2',
        typeName: 'Type2',
        type: 'type',
        rowId: 2,
        level: 1,
        userFacingVersion: '1',
        hideTypeName: true,
      },
    ];

    spectator.setInput('chipsSelectionData', testData);
    spectator.detectChanges();

    const chips = spectator.queryAll('mat-chip-option');

    expect(chips.length).toBe(2);

    expect(chips[0].textContent).toContain('Type1: Item1');
    expect(chips[1].textContent).toContain('Item2');
  });

  it('should emit selectionChipRemoved when a chip is removed', () => {
    const testData: DatasourceSelectionChipData[] = [
      {
        name: 'Item1',
        typeName: 'Type1',
        type: 'type',
        rowId: 1,
        level: 0,
        userFacingVersion: 'Latest',
      },
    ];

    spectator.setInput('chipsSelectionData', testData);
    spectator.detectChanges();

    const removeIcon = spectator.query('mat-icon[matChipRemove]');
    const selectionChipRemovedSpy = spyOn(spectator.component.selectionChipRemoved, 'emit');

    spectator.click(removeIcon);

    expect(selectionChipRemovedSpy).toHaveBeenCalledWith(testData[0]);
  });
});
