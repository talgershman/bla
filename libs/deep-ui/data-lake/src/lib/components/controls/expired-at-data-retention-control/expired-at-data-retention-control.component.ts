import {Component} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MeDateComponent} from '@mobileye/material/src/lib/components/form/date';
import {UntilDestroy} from '@ngneat/until-destroy';
import {DataRetentionControlComponent} from 'deep-ui/shared/components/src/lib/controls/data-retention-control';

@UntilDestroy()
@Component({
  selector: 'de-expired-at-data-retention-control',
  templateUrl: './expired-at-data-retention-control.component.html',
  styleUrls: ['./expired-at-data-retention-control.component.scss'],
  imports: [MeDateComponent, ReactiveFormsModule, MatCheckboxModule],
})
export class ExpiredAtDataRetentionControlComponent extends DataRetentionControlComponent {}
