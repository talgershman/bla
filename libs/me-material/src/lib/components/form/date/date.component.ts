import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
} from '@angular/material/core';
import {MatDatepicker, MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldControl, MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {DateFnsAdapter} from '@angular/material-date-fns-adapter';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {insertTodayButtonCalendar} from '@mobileye/material/src/lib/common';
import {MeBaseFormFieldControlDirective} from '@mobileye/material/src/lib/components/form';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {startOfToday} from 'date-fns';
import {enUS} from 'date-fns/locale';

export const MY_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'dd/MM/yyyy',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

@UntilDestroy()
@Component({
  selector: 'me-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.scss'],
  providers: [
    {provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS},
    {
      provide: DateAdapter<any>,
      useClass: DateFnsAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: enUS,
    },
    {provide: MatFormFieldControl, useExisting: MeDateComponent},
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HintIconComponent,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatButtonModule,
  ],
  host: {
    '[id]': 'id',
    '[title]': 'title',
  },
  animations: [MeFadeInOutAnimation],
})
export class MeDateComponent extends MeBaseFormFieldControlDirective<Date> {
  @ViewChild('inputElem') inputElement: ElementRef;

  @Input()
  min: Date;

  @Input()
  max: Date;

  @Input()
  startAtDate: Date;

  @Input()
  panelClass: string;

  @Input()
  hideClearButton: boolean;

  @Input()
  runInZone: boolean;

  @Output()
  dateChanged = new EventEmitter<any>();

  controlType = 'me-date';

  id = `me-date-${MeDateComponent.nextId++}`;

  todayDate: Date;

  ngOnInit(): void {
    super.ngOnInit();
    this.todayDate = startOfToday();
    this.innerController?.valueChanges.pipe(untilDestroyed(this)).subscribe((value: Date) => {
      this.dateChanged.emit(value);
    });
  }

  writeValue(value: any): void {
    this.innerController.setValue(null);
    this.value = value;
  }

  getFocusHTMLElement(): HTMLElement {
    return this.inputElement.nativeElement;
  }

  onClearClicked(): void {
    this.innerController.setValue(null);
  }

  onOpen(picker: MatDatepicker<Date>) {
    insertTodayButtonCalendar(picker, this.min, this.max, this.todayDate);
  }
}
