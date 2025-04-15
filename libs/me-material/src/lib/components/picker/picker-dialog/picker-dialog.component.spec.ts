import {NgTemplateOutlet} from '@angular/common';
import {Component, TemplateRef, ViewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {PickerDialogComponent} from './picker-dialog.component';

@Component({
  selector: 'dialog-mock',
  template: `<ng-template #dialogContent>
    <div>Dialog Content</div>
  </ng-template>`,
  standalone: false,
})
class MockComponent {
  @ViewChild('dialogContent', {static: true}) dialogContent!: TemplateRef<any>;
}

describe('PickerDialogComponent', () => {
  let spectator: Spectator<PickerDialogComponent>;
  const createComponent = createComponentFactory({
    component: PickerDialogComponent,
    imports: [NgTemplateOutlet, MatIconModule, MatButtonModule, MatDialogModule],
    detectChanges: false,
  });

  const createMock = createComponentFactory({
    component: MockComponent,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();

    spectator.setInput('dialogTemplate', createMock().component.dialogContent);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should render the dialog title if provided', () => {
    spectator.setInput('dialogTitle', 'Test Title');
    spectator.detectChanges();

    expect(spectator.query('.step-label')).toHaveText('Test Title');
  });

  it('should not show close button if hideCloseButton is true', () => {
    spectator.setInput('hideCloseButton', true);
    spectator.detectChanges();

    expect(spectator.query('button[mat-dialog-close]')).toBeNull();
  });

  it('should show close button if hideCloseButton is false', () => {
    spectator.setInput('hideCloseButton', false);
    spectator.detectChanges();

    expect(spectator.query('button[mat-dialog-close]')).not.toBeNull();
  });

  it('should emit closeDialog when onSelected is called', () => {
    let emitted = false;
    spectator.component.closeDialog.subscribe(() => (emitted = true));
    spectator.component.onSelected();

    expect(emitted).toBe(true);
  });

  it('should render the provided dialog template', () => {
    spectator.detectChanges();
    // The template is rendered inside the main with class 'flex-1 overflow-auto'
    expect(spectator.query('main')).toContainText('Dialog Content');
  });
});
