import {KeyValuePipe} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeJsonMessageComponent} from '@mobileye/material/src/lib/components/json-message';
import {
  ColorPaletteIndexEnum,
  MeJsonMessageUiConfigs,
  MeJsonMessageUiKeyConfigs,
  MeJsonMessageUiValueConfigs,
} from '@mobileye/material/src/lib/components/json-message/common';

import {ALL_OBJ, DEFAULT_OBJ, ERROR_OBJ, HTML_OBJ, LINK_OBJ} from './json-message-fiddle-entities';

@Component({
  selector: 'de-json-message-fiddle',
  imports: [
    MeJsonMessageComponent,
    MeJsonEditorComponent,
    ReactiveFormsModule,
    MatButtonModule,
    KeyValuePipe,
  ],
  templateUrl: './json-message-fiddle.component.html',
  styleUrls: ['./json-message-fiddle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonMessageFiddleComponent implements OnInit {
  jsonMessageControl = new FormControl(ALL_OBJ);
  previewMsgValue: any;

  meJsonMessageUiKeyConfigs = new MeJsonMessageUiKeyConfigs() as any;
  meJsonMessageUiValueConfigs = new MeJsonMessageUiValueConfigs() as any;
  MeJsonMessageUiConfigs = new MeJsonMessageUiConfigs() as any;
  ColorPaletteIndexEnum = ColorPaletteIndexEnum;

  private cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.applyChanges();
  }
  getTypeOf(value): any {
    return typeof value;
  }

  setExampleAll(): void {
    this.jsonMessageControl.setValue(ALL_OBJ);
    this.applyChanges();
  }

  setExampleLink(): void {
    this.jsonMessageControl.setValue(LINK_OBJ);
    this.applyChanges();
  }

  setExampleHtml(): void {
    this.jsonMessageControl.setValue(HTML_OBJ);
    this.applyChanges();
  }
  setExampleDefault(): void {
    this.jsonMessageControl.setValue(DEFAULT_OBJ);
    this.applyChanges();
  }

  setExampleError() {
    this.jsonMessageControl.setValue(ERROR_OBJ);
    this.applyChanges();
  }

  applyChanges() {
    setTimeout(() => {
      this.previewMsgValue = {
        ...this.jsonMessageControl.value,
      };
      this.cd.detectChanges();
    });
  }
}
