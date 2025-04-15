import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, input, output, TemplateRef} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'me-picker-dialog',
  imports: [NgTemplateOutlet, MatIconModule, MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './picker-dialog.component.html',
  styleUrl: './picker-dialog.component.scss',
})
export class PickerDialogComponent {
  dialogTemplate = input.required<TemplateRef<any>>();
  dialogTitle = input<string>();
  hideCloseButton = input<boolean>(false);
  hideFooter = input<boolean>(true);
  isSelectDisabled = input<boolean>(false);
  closeDialog = output<void>();
  hasSelectedChange = false;

  onSelected(): void {
    this.hasSelectedChange = true;
    this.closeDialog.emit();
  }
}
