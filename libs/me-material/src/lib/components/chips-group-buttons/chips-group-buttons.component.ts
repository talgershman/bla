import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {MatChipListbox, MatChipListboxChange, MatChipOption} from '@angular/material/chips';

export type MeChipsGroupOption = {
  id: string;
  label: string;
};
@Component({
  selector: 'me-chips-group-buttons',
  templateUrl: './chips-group-buttons.component.html',
  styleUrls: ['./chips-group-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block',
  },
  imports: [MatChipListbox, MatChipOption],
})
export class MeChipsGroupButtonsComponent {
  selectedOption = model.required<string>();

  options = input.required<Array<MeChipsGroupOption>>();

  onChange(event: MatChipListboxChange, chipList: MatChipListbox): void {
    //prevent
    if (!event.source?.selected) {
      this._preventDeSelectOfChip(chipList);
    } else {
      this.selectedOption.set(event.value);
    }
  }

  private _preventDeSelectOfChip(chipList: MatChipListbox): void {
    const selectedChip = chipList._chips.find((chip) => chip.value === this.selectedOption());
    if (selectedChip) {
      selectedChip.toggleSelected();
    }
  }
}
