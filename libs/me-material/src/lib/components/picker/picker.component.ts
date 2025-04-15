import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {PickerDialogComponent} from '@mobileye/material/src/lib/components/picker/picker-dialog';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'me-picker',
  imports: [MatButtonModule, MatIconModule, MatDialogModule, MeTooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './picker.component.html',
  styleUrl: './picker.component.scss',
})
export class MePickerComponent {
  pickerTitle = input<string>();
  pickerDialogTitle = input<string>();
  dialogTemplate = input.required<TemplateRef<any>>();
  hideDialogCloseButton = input<boolean>(false);
  hideDialogFooter = input<boolean>(true);
  isOpenDialogDisabled = input<boolean>();
  isSelectDialogDisabled = input<boolean>(false);
  openDialog = output<MatDialogRef<PickerDialogComponent>>();
  closeDialog = output<boolean>();
  private dialog = inject(MatDialog);

  onOpenDialog(): void {
    const dialogRef: MatDialogRef<PickerDialogComponent> = this.dialog.open(PickerDialogComponent, {
      width: '72rem',
      height: '90vh',
      maxHeight: '64rem',
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.dialogTitle = this.pickerDialogTitle;
    dialogRef.componentInstance.dialogTemplate = this.dialogTemplate;
    dialogRef.componentInstance.hideCloseButton = this.hideDialogCloseButton;
    dialogRef.componentInstance.hideFooter = this.hideDialogFooter;
    dialogRef.componentInstance.isSelectDisabled = this.isSelectDialogDisabled;
    dialogRef.componentInstance.closeDialog.subscribe(() => {
      dialogRef.close();
      this.closeDialog.emit(true);
    });
    dialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        if (!dialogRef.componentInstance.hasSelectedChange) {
          this.closeDialog.emit(false);
        }
      });
    this.openDialog.emit(dialogRef);
  }
}
