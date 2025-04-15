import {ChangeDetectionStrategy, Component, inject, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleChange, MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {prettyPrintJson} from '@mobileye/material/src/lib/utils';
import copy from 'copy-to-clipboard';
import {OnChange} from 'property-watch-decorator';

export const JSON_SNIPPET_USER_PREFERENCE_KEY = 'json-snippet-dialog';

@Component({
  selector: 'de-json-snippet',
  templateUrl: './json-snippet.component.html',
  styleUrls: ['./json-snippet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MeJsonEditorComponent,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
})
export class JsonSnippetComponent implements OnInit {
  @ViewChild(MeJsonEditorComponent) editor: MeJsonEditorComponent;

  @OnChange<void>('_onExtraDataToggleNameChanged')
  @Input()
  extraDataToggleName: string;

  @OnChange<void>('_onMinDataChanged')
  @Input()
  minData: any;

  public data = inject(MAT_DIALOG_DATA);
  private snackbarService = inject(MeSnackbarService);
  private userPreferencesService = inject(MeUserPreferencesService);

  prettyJson: string;

  jsonControl = new FormControl<any>(this.data);

  hideExtraData: boolean;

  ngOnInit(): void {
    this.hideExtraData =
      this.userPreferencesService.getUserPreferencesByKey(JSON_SNIPPET_USER_PREFERENCE_KEY) ?? true;
    if (!this.hideExtraData) {
      const shownData = this.data;
      this.jsonControl.setValue(shownData);
    }
  }

  copyCmdToClipboard(): void {
    this.prettyJson = prettyPrintJson(this.jsonControl.value);
    copy(this.prettyJson);
    this.snackbarService.onCopyToClipboard();
  }

  onToggleChanged(value: MatSlideToggleChange): void {
    this.hideExtraData = value.checked;
    const shownData = this.hideExtraData ? this.minData : this.data;
    this.jsonControl.setValue(shownData);
    this.userPreferencesService.addUserPreferences(
      JSON_SNIPPET_USER_PREFERENCE_KEY,
      this.hideExtraData,
    );
  }

  private _onExtraDataToggleNameChanged(): void {
    this.hideExtraData = !!this.extraDataToggleName;
  }

  private _onMinDataChanged(): void {
    this.jsonControl.setValue(this.minData);
  }
}
