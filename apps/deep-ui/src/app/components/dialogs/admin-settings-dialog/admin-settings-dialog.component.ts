import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {Store} from '@ngrx/store';
import {DeepUtilService, setActiveUserFromAdminSettings} from 'deep-ui/shared/core';

@Component({
  selector: 'de-admin-settings-dialog',
  templateUrl: './admin-settings-dialog.component.html',
  styleUrls: ['./admin-settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MeFormControlChipsFieldComponent,
    ReactiveFormsModule,
  ],
})
export class AdminSettingsDialogComponent implements OnInit {
  deepUtilService = inject(DeepUtilService);
  store = inject(Store);
  dialog = inject(MatDialog);

  form = new FormGroup({
    team: new FormControl(),
  });

  ngOnInit(): void {
    const teams = this.deepUtilService.getCurrentUserTeams();
    this.form.controls.team.setValue(teams);
  }

  onSubmit(): void {
    const updatedTeams = this.form.controls.team.value || [];
    this.store.dispatch(setActiveUserFromAdminSettings({teams: updatedTeams}));
    this.dialog.closeAll();
  }
}
