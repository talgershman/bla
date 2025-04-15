import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';

export interface DatasourceSelectionChipData {
  name: string;
  typeName: string;
  type: string;
  rowId: string | number;
  level: number;
  userFacingVersion: string;
  hideTypeName?: boolean;
}

@Component({
  selector: 'de-select-datasource-selections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select-datasource-selections.component.html',
  styleUrl: './select-datasource-selections.component.scss',
  imports: [MatChipsModule, MatIconModule, MeTooltipDirective],
})
export class SelectDatasourceSelectionsComponent {
  chipsSelectionData = input<Array<DatasourceSelectionChipData>>([]);
  selectionChipRemoved = output<DatasourceSelectionChipData>();

  onSelectionRemoved(selection: DatasourceSelectionChipData): void {
    this.selectionChipRemoved.emit(selection);
  }
}
