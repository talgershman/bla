import {Component, EventEmitter, TemplateRef, ViewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {PickerDialogComponent} from '@mobileye/material/src/lib/components/picker/picker-dialog';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {Subject} from 'rxjs';

import {MePickerComponent} from './picker.component';

@Component({
  selector: 'app-mock',
  template: `<ng-template #dialogContent>
    <div>Dialog Content</div>
  </ng-template>`,
  standalone: false,
})
class MockComponent {
  @ViewChild('dialogContent', {static: true}) dialogContent!: TemplateRef<any>;
}

describe('MePickerComponent', () => {
  let spectator: Spectator<MePickerComponent>;
  let mockComponent: MockComponent;
  let dialogOpenSpy: jasmine.Spy;
  let dialogRefMock: jasmine.SpyObj<MatDialogRef<PickerDialogComponent>>;
  let afterClosedSubject: Subject<void>;

  const createComponent = createComponentFactory({
    component: MePickerComponent,
    imports: [
      MatButtonModule,
      MatIconModule,
      MatDialogModule,
      MeTooltipDirective,
      PickerDialogComponent,
    ],
    detectChanges: false,
  });

  const createMock = createComponentFactory({
    component: MockComponent,
    detectChanges: false,
  });

  beforeAll(() => {
    const mockSpectator = createMock(); // Create only once
    mockComponent = mockSpectator.component; // Store the MockComponent instance
  });

  beforeEach(() => {
    afterClosedSubject = new Subject<void>();
    dialogRefMock = jasmine.createSpyObj('MatDialogRef', ['close'], {
      componentInstance: {
        dialogTitle: '',
        dialogTemplate: null,
        hideCloseButton: false,
        closeDialog: new EventEmitter<void>(),
      },
      afterClosed: () => afterClosedSubject.asObservable(),
    });
    const matDialogMock = jasmine.createSpyObj('MatDialog', ['open']);
    dialogOpenSpy = matDialogMock.open.and.returnValue(dialogRefMock);

    spectator = createComponent({
      providers: [{provide: MatDialog, useValue: matDialogMock}],
      detectChanges: false,
    });

    spectator.setInput('dialogTemplate', mockComponent.dialogContent); // Reuse the single instance
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should display the picker title', () => {
    spectator.setInput('pickerTitle', 'Test Picker');
    spectator.detectChanges();

    expect(spectator.query('.open-button')).toHaveText('Test Picker arrow_drop_down');
  });

  it('should disable the button when isOpenDialogDisabled is true', () => {
    spectator.setInput('isOpenDialogDisabled', true);
    spectator.detectChanges();

    expect(spectator.query('button')).toHaveAttribute('disabled');
  });

  it('should open dialog when button is clicked', () => {
    spectator.setInput('isOpenDialogDisabled', false);
    spectator.detectChanges();

    spectator.click('button.open-button');

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      PickerDialogComponent,
      jasmine.objectContaining({
        width: '72rem',
        height: '90vh',
        maxHeight: '64rem',
        autoFocus: false,
        restoreFocus: false,
        panelClass: 'dialog-panel-overlap',
      }),
    );
  });

  it('should set dialog properties when dialog is opened', () => {
    spectator.setInput('pickerDialogTitle', 'Dialog Title');
    spectator.setInput('hideDialogCloseButton', true);
    spectator.detectChanges();

    spectator.click('button.open-button');

    expect(dialogRefMock.componentInstance.dialogTitle()).toBe('Dialog Title');
    expect(dialogRefMock.componentInstance.dialogTemplate()).toBe(mockComponent.dialogContent);
    expect(dialogRefMock.componentInstance.hideCloseButton()).toBe(true);
  });

  it('should subscribe to and close dialog on closeDialog event', () => {
    spectator.click('button.open-button');
    const closeDialogSubscription = dialogRefMock.componentInstance.closeDialog;
    closeDialogSubscription.emit();

    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  it('should emit openDialog when dialog is opened', () => {
    let dialogRefEmitted: MatDialogRef<any> | undefined;
    spectator.component.openDialog.subscribe((ref) => (dialogRefEmitted = ref));
    spectator.click('button.open-button');

    expect(dialogRefEmitted).toBe(dialogRefMock);
  });

  it('should handle dialog close event from afterClosed', () => {
    let closeDialogEmitted: boolean | undefined;
    spectator.component.closeDialog.subscribe((value) => (closeDialogEmitted = value));

    spectator.click('button.open-button');
    spectator.detectChanges();

    // Simulate dialog being closed without selection
    afterClosedSubject.next();

    expect(closeDialogEmitted).toBe(false);

    // Reset for next test
    closeDialogEmitted = undefined;

    // Simulate dialog being closed with selection
    dialogRefMock.componentInstance.hasSelectedChange = true;
    afterClosedSubject.next();

    expect(closeDialogEmitted).toBeUndefined(); // Since no emission occurs when selected
  });
});
