import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  ViewChild,
} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import {MatFormFieldControl, MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeBaseFormFieldControlDirective} from '@mobileye/material/src/lib/components/form';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import {BehaviorSubject} from 'rxjs';
import {startWith} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'me-chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'id',
    '[title]': 'title',
  },
  imports: [
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    HintIconComponent,
    MeTooltipDirective,
  ],
  animations: [MeFadeInOutAnimation],
  providers: [{provide: MatFormFieldControl, useExisting: MeFormControlChipsFieldComponent}],
})
export class MeFormControlChipsFieldComponent extends MeBaseFormFieldControlDirective<
  Array<string>
> {
  @ViewChild('areaInput') areaInput: ElementRef;

  @HostBinding('style.--width')
  @Input()
  width: string;

  @Input()
  separatorKeysCodes: Array<number> = [ENTER, COMMA, SPACE];

  controlsSubject = new BehaviorSubject<Array<string>>([]);
  controls$ = this.controlsSubject.asObservable();

  controlType = 'me-chips';
  id = `me-chips-${MeFormControlChipsFieldComponent.nextId++}`;

  writeValue(value: any): void {
    this.value = [...(value || [])];
  }

  getFocusHTMLElement(): HTMLElement {
    return this.areaInput.nativeElement;
  }

  ngOnInit(): void {
    this.innerController.valueChanges
      .pipe(startWith(this.innerController.value), untilDestroyed(this))
      .subscribe(() => {
        this.controlsSubject.next([...(this.innerController.value || [])]);
      });
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const isFound = _find(
      this.innerController.value,
      (chip: string) => chip.toLowerCase() === value.toLowerCase(),
    );
    if (!isFound && value) {
      const currentArr = this.innerController.value || [];
      currentArr.push(value);
      this.innerController.setValue([...currentArr]);
      this.onChange(this.value);
    }
    // Clear the input value
    event.chipInput?.clear();
    this.innerController.markAsDirty();
  }

  remove(index: number): void {
    if (index >= 0) {
      const currentArr = this.innerController.value || [];
      currentArr.splice(index, 1);
      this.innerController.setValue([...currentArr]);
      this.onChange(this.value);
    }
    this.innerController.markAsDirty();
  }

  markAsTouched(): void {
    if (!this.innerController.touched) {
      this.innerController.markAsTouched();
      this.onChange(this.value);
    }
  }

  addPastedValue(event: ClipboardEvent) {
    const pastedValue = event?.clipboardData?.getData('text')?.trim() || '';
    if (!pastedValue) {
      return;
    }

    // Split pasted value by commas and remove leading/trailing spaces
    let pastedChips = pastedValue.split(',').map((chip) => chip.trim());
    pastedChips = _filter(pastedChips, (chip: string) => !!chip.trim());

    // Store chips to be added
    const chipsToAdd = [];

    // Check for duplicates and collect unique chips
    pastedChips.forEach((chip) => {
      const isFound = _find(
        this.innerController.value,
        (c: string) => c.toLowerCase() === chip.toLowerCase(),
      );
      if (!isFound) {
        chipsToAdd.push(chip);
      }
    });

    // Update innerController value once with all unique chips
    if (chipsToAdd.length) {
      const currentArr = this.innerController.value || [];
      this.innerController.setValue([...currentArr, ...chipsToAdd]);
      this.onChange(this.value); // Trigger change event after updating value
    }

    // Clear the input field
    setTimeout(() => {
      this.areaInput.nativeElement.value = '';
    });
  }
}
