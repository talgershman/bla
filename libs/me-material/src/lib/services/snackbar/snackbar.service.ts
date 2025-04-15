import {Component, inject, Injectable} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef,
} from '@angular/material/snack-bar';

@Component({
  selector: 'me-snackbar',
  template: `<div class="flex justify-between items-center">
    <span [innerHTML]="data"></span>
    <span class="mat-simple-snackbar-action">
      <button mat-button class="relative" (click)="dismissSnackbar()">Close</button></span
    >
  </div>`,
  imports: [MatButtonModule],
})
export class MeSnackbarComponent {
  data = inject(MAT_SNACK_BAR_DATA);
  snackBar = inject(MatSnackBar);

  dismissSnackbar(): void {
    this.snackBar.dismiss();
  }
}

@Injectable()
export class MeSnackbarService {
  protected snackBar = inject(MatSnackBar);

  open(
    message: string,
    config: Partial<MatSnackBarConfig> = {
      duration: 2000,
      verticalPosition: 'bottom',
      horizontalPosition: 'left',
    },
  ): MatSnackBarRef<any> {
    if (!message) {
      return null;
    }
    return this.snackBar.openFromComponent(MeSnackbarComponent, {
      data: message,
      ...config,
    });
  }

  onCreate(name: string): MatSnackBarRef<any> {
    if (!name) {
      return null;
    }
    return this.open(`<b>${name}</b> was created successfully`);
  }

  onUpdate(name: string): MatSnackBarRef<any> {
    if (!name) {
      return null;
    }
    return this.open(`<b>${name}</b> was updated successfully`);
  }

  onDelete(name: string): MatSnackBarRef<any> {
    if (!name) {
      return null;
    }
    return this.open(`<b>${name}</b> deleted`);
  }

  onDownloadStarted(): MatSnackBarRef<any> {
    return this.open('Download started');
  }

  onCopyToClipboard(): MatSnackBarRef<any> {
    return this.open('Copied to clipboard');
  }
}
