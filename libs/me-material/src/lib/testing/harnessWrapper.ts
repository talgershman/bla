import {HarnessLoader} from '@angular/cdk/testing';
import {DebugElement} from '@angular/core';
import {ComponentFixture} from '@angular/core/testing';
import {FormControl} from '@angular/forms';
import {
  AutocompleteHarnessFilters,
  MatAutocompleteHarness,
} from '@angular/material/autocomplete/testing';
import {ButtonHarnessFilters, MatButtonHarness} from '@angular/material/button/testing';
import {CheckboxHarnessFilters, MatCheckboxHarness} from '@angular/material/checkbox/testing';
import {
  ChipListboxHarnessFilters,
  ChipOptionHarnessFilters,
  MatChipListboxHarness,
} from '@angular/material/chips/testing';
import {MatOptionHarness} from '@angular/material/core/testing';
import {
  DatepickerToggleHarnessFilters,
  MatCalendarHarness,
  MatDatepickerToggleHarness,
} from '@angular/material/datepicker/testing';
import {MatDialogHarness} from '@angular/material/dialog/testing';
import {
  ExpansionPanelHarnessFilters,
  MatExpansionPanelHarness,
} from '@angular/material/expansion/testing';
import {InputHarnessFilters, MatInputHarness} from '@angular/material/input/testing';
import {MatMenuItemHarness, MenuItemHarnessFilters} from '@angular/material/menu/testing';
import {MatSelectHarness, SelectHarnessFilters} from '@angular/material/select/testing';
import {
  MatSlideToggleHarness,
  SlideToggleHarnessFilters,
} from '@angular/material/slide-toggle/testing';
import {MatSliderThumbHarness, SliderThumbHarnessFilters} from '@angular/material/slider/testing';
import {MatRowHarness, MatTableHarness, TableHarnessFilters} from '@angular/material/table/testing';
import {
  MatTabGroupHarness,
  TabGroupHarnessFilters,
  TabHarnessFilters,
} from '@angular/material/tabs/testing';
import {By} from '@angular/platform-browser';
import {MeClientSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/client-side-table';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';

import {
  getElementBySelector,
  getElementsBySelector,
  waitForDeferredBlocks,
  waitForElement,
} from './utils';

export abstract class MeButtonHarness {
  static async click(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: ButtonHarnessFilters,
  ): Promise<MatButtonHarness> {
    await MeButtonHarness.waitUntilButtonEnabled(loader, filters);
    const buttonHarness = await loader.getHarness<MatButtonHarness>(MatButtonHarness.with(filters));
    await buttonHarness.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return buttonHarness;
  }
  static async isDisabled(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: ButtonHarnessFilters,
  ): Promise<boolean> {
    const buttonHarness = await loader.getHarness<MatButtonHarness>(MatButtonHarness.with(filters));
    return await buttonHarness.isDisabled();
  }

  static async waitUntilButtonEnabled(
    loader: HarnessLoader,
    filters: ButtonHarnessFilters,
    maxRetries = 10,
    retryInterval = 200,
  ): Promise<void> {
    const buttonHarness = await loader.getHarness<MatButtonHarness>(MatButtonHarness.with(filters));
    const checkEnabled = async (retries: number): Promise<void> => {
      const isDisabled = await buttonHarness.isDisabled();

      if (!isDisabled) {
        // Button is not disabled, resolve the promise
        return Promise.resolve();
      } else if (retries < maxRetries) {
        // Button is still disabled, retry after the specified interval
        return new Promise<void>((resolve) => {
          setTimeout(() => resolve(checkEnabled(retries + 1)), retryInterval);
        });
      } else {
        // Exceeded maximum retries, reject the promise
        return Promise.reject(new Error(`Button not enabled after ${maxRetries} retries`));
      }
    };

    // Start the recursion with 0 retries
    return checkEnabled(0);
  }
}

export abstract class MeInputHarness {
  static async setValue(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: InputHarnessFilters,
    text: string,
  ): Promise<MeInputHarness> {
    const inputHarness = await loader.getHarness<MatInputHarness>(MatInputHarness.with(filters));
    await inputHarness.setValue(text);
    await inputHarness.blur();
    fixture.detectChanges();
    await fixture.whenStable();
    return inputHarness;
  }

  static async setValues(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: InputHarnessFilters,
    texts: string[],
  ): Promise<Array<MatInputHarness>> {
    const inputAllHarness = await loader.getAllHarnesses<MatInputHarness>(
      MatInputHarness.with(filters),
    );
    for (let i = 0; i < texts.length; i += 1) {
      await inputAllHarness[i].setValue(texts[i]);
      fixture.detectChanges();
    }
    return inputAllHarness;
  }
}

export abstract class MeInputListHarness {
  static async setValue(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: InputHarnessFilters,
    text: string,
  ): Promise<MeInputHarness> {
    return MeInputHarness.setValue(fixture, loader, filters, text);
  }

  static async addItem(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    selector: string,
    filters: InputHarnessFilters,
    text: string,
  ): Promise<MeInputHarness> {
    const scope = fixture.debugElement.query(By.css(selector));
    const addButton = scope.query(By.css('.add-button'));
    addButton.nativeElement.click();
    fixture.detectChanges();
    const inputHarness = await loader.getAllHarnesses<MatInputHarness>(
      MatInputHarness.with(filters),
    );

    await inputHarness[inputHarness.length - 1].setValue(text);
    await inputHarness[inputHarness.length - 1].blur();
    fixture.detectChanges();
    return inputHarness[inputHarness.length - 1];
  }
}

export abstract class MeAutoCompleteHarness {
  static async selectOptionByText(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    inputFilters: InputHarnessFilters,
    autoFilters: AutocompleteHarnessFilters,
    text: string,
  ): Promise<MatAutocompleteHarness> {
    const inputHarness = await loader.getHarness(MatInputHarness.with(inputFilters));
    await inputHarness.setValue(text);

    const autocompleteHarness = await loader.getHarness(MatAutocompleteHarness.with(autoFilters));
    await autocompleteHarness.selectOption({text});
    await autocompleteHarness.blur();
    fixture.detectChanges();

    return autocompleteHarness;
  }
}

export abstract class MeSliderHarness {
  static async setValue(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    sliderThumbHarnessFilters: SliderThumbHarnessFilters,
    value: number,
  ): Promise<MatSliderThumbHarness> {
    const sliderHarness = await loader.getHarness(
      MatSliderThumbHarness.with(sliderThumbHarnessFilters),
    );
    await sliderHarness.setValue(value);
    fixture.detectChanges();

    return sliderHarness;
  }
}

export abstract class MeCheckBoxHarness {
  static async check(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filers: CheckboxHarnessFilters,
  ): Promise<MatCheckboxHarness> {
    const checkboxHarness = await loader.getHarness<MatCheckboxHarness>(
      MatCheckboxHarness.with(filers),
    );
    await checkboxHarness.check();
    fixture.detectChanges();

    return checkboxHarness;
  }
}

export abstract class MeSliderToggleHarness {
  static async check(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filers: SlideToggleHarnessFilters,
  ): Promise<MatSlideToggleHarness> {
    const slideHarness = await loader.getHarness<MatSlideToggleHarness>(
      MatSlideToggleHarness.with(filers),
    );
    await slideHarness.check();
    fixture.detectChanges();
    await fixture.whenStable();

    return slideHarness;
  }
}

export abstract class MeSelectHarness {
  static async selectOptionByText(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    docLoader: HarnessLoader,
    selectFilters: SelectHarnessFilters,
    text: string,
    shouldClose = true,
  ): Promise<MatSelectHarness> {
    const selectHarness = await loader.getHarness<MatSelectHarness>(
      MatSelectHarness.with(selectFilters),
    );
    await selectHarness.open();

    const optionHarness = await docLoader.getHarness<MatOptionHarness>(
      MatOptionHarness.with({text}),
    );
    await optionHarness.click();
    if (shouldClose) {
      await selectHarness.close();
    }
    fixture.detectChanges();
    return selectHarness;
  }
}

export abstract class MeJsonEditorHarness {
  static async setValue(
    fixture: ComponentFixture<any>,
    control: FormControl<any>,
    value: any,
  ): Promise<void> {
    control.setValue(value);
    fixture.detectChanges();
    fixture.detectChanges();
    await fixture.whenStable();
  }
}

export abstract class MeAutoCompleteChipHarness {
  static async addTag(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: InputHarnessFilters,
    autoCompleteFilters: AutocompleteHarnessFilters,
    text: string,
  ): Promise<void> {
    const inputHarness = await loader.getHarness<MatInputHarness>(MatInputHarness.with(filters));
    await inputHarness.setValue(text);
    await inputHarness.blur();

    const autocompleteHarness = await loader.getHarness<MatAutocompleteHarness>(
      MatAutocompleteHarness.with(autoCompleteFilters),
    );

    const options = await autocompleteHarness.getOptions();

    for (const option of options) {
      const optionText = await option.getText();
      if (optionText === text) {
        await option.click();
      }
    }
  }
}

export abstract class MeChipHarness {
  static async selectChip(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    chipListboxHarnessFilters: ChipListboxHarnessFilters,
    chipOptionHarnessFilters: ChipOptionHarnessFilters,
  ): Promise<void> {
    const chipHarness = await loader.getHarness<MatChipListboxHarness>(
      MatChipListboxHarness.with(chipListboxHarnessFilters),
    );
    await chipHarness.selectChips(chipOptionHarnessFilters);

    fixture.detectChanges();
    await fixture.whenStable();
  }
  static async addTag(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: InputHarnessFilters,
    text: string,
  ): Promise<void> {
    const inputHarness = await loader.getHarness<MatInputHarness>(MatInputHarness.with(filters));
    await inputHarness.setValue(text);
    await inputHarness.blur();
  }

  static async clear(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    selector: string,
  ): Promise<void> {
    const scope = fixture.debugElement.query(By.css(selector));
    const chipInstance = scope.componentInstance as MeFormControlChipsFieldComponent;
    const length = chipInstance.innerController.value.length;
    for (let i = length - 1; i >= 0; i -= 1) {
      chipInstance.remove(i);
      fixture.detectChanges();
    }
    await fixture.whenStable();
  }
}

export abstract class MeTableHarness {
  static async getRows(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: TableHarnessFilters,
  ): Promise<MatRowHarness[]> {
    const matTableHarness = await loader.getHarness(MatTableHarness.with(filters));
    return matTableHarness.getRows();
  }

  static async clickRow(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: TableHarnessFilters,
    rowIndex: number,
  ): Promise<MatTableHarness> {
    const matTableHarness = await loader.getHarness(MatTableHarness);
    const rows = await matTableHarness.getRows();
    const rowElemFirst = await rows[rowIndex].host();
    await rowElemFirst.click();
    return matTableHarness;
  }
}

export abstract class MeAgTableHarness {
  static async waitForLoadingToFinished(
    fixture: ComponentFixture<any>,
    maxRetries = 10,
  ): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve, reject) => {
      let retries = 0;

      const checkLoading = () => {
        const element = getElementBySelector(fixture, `me-ag-loading-cell`);
        retries++;
        if (!element) {
          resolve();
        } else if (retries < maxRetries) {
          requestIdleCallback(checkLoading, {timeout: 200});
        } else {
          reject(new Error(`waitForLoadingToFinished - Exceeded maximum retries (${maxRetries})`));
        }
      };

      checkLoading();
    });
  }
  static async waitForTable(
    fixture: ComponentFixture<any>,
    maxRetries = 10,
    overlayContainerElement?: HTMLElement,
  ): Promise<void> {
    await waitForDeferredBlocks(fixture);
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve, reject) => {
      let retries = 0;

      const checkGridApi = async () => {
        let element: DebugElement;
        element = getElementBySelector(fixture, `me-client-side-table`, overlayContainerElement);
        if (!element) {
          element = getElementBySelector(fixture, `me-server-side-table`, overlayContainerElement);
        }
        const table = element?.componentInstance as MeClientSideTableComponent<any>;
        const gridApi = table?.gridApi;
        const isLoading = table?.tableApiService.isLoading.getValue();

        retries++;
        // need to wait for both, because the table maybe be ready but the loader is still showing and we can't get any rows yet
        if (gridApi && !isLoading) {
          resolve();
        } else if (retries < maxRetries) {
          if (table?.componentId) {
            table.triggerCd();
          } else {
            await waitForDeferredBlocks(fixture);
          }
          await fixture.whenStable();
          requestIdleCallback(checkGridApi, {timeout: 200});
        } else {
          reject(new Error(`WaitForTable - Exceeded maximum retries (${maxRetries})`));
        }
      };

      await checkGridApi();
    });
  }
  static async clickRow(fixture: ComponentFixture<any>, rowIndex: number): Promise<void> {
    await MeAgTableHarness.waitForTable(fixture);
    const element = getElementBySelector(fixture, `.ag-row[row-index="${rowIndex}"]`);
    element.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  static async clickRowByValue(
    fixture: ComponentFixture<any>,
    value: string,
    groupIndex?: number,
  ): Promise<void> {
    await MeAgTableHarness.waitForTable(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    await MeAgTableHarness.waitForLoadingToFinished(fixture);
    if (groupIndex !== undefined) {
      await this._handleGroupRowClick(fixture, value, groupIndex);
    } else {
      //click on row
      await this._handleRegularRowClick(fixture, value);
    }

    fixture.detectChanges();
    await fixture.whenStable();
  }

  static async clickRowsByValueAndGroupIndexes(
    fixture: ComponentFixture<any>,
    value: string,
    groupIndexes: Array<number>,
  ): Promise<void> {
    await MeAgTableHarness.waitForTable(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    await MeAgTableHarness.waitForLoadingToFinished(fixture);
    for (let i = 0; i < groupIndexes.length; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      if (i === groupIndexes.length - 1) {
        await this._handleGroupRowClick(fixture, value, groupIndexes[i]);
      } else {
        await this._handleGroupRowClick(fixture, value, groupIndexes[i], true);
      }
    }

    fixture.detectChanges();
    await fixture.whenStable();
  }

  static async clickGroupByValue(
    fixture: ComponentFixture<any>,
    groupName: string,
    rowIndex: number,
    callback?: () => Promise<void>,
    overlayContainerElement?: HTMLElement,
  ): Promise<void> {
    await MeAgTableHarness.waitForTable(fixture, 10, overlayContainerElement);

    if (callback) {
      await callback();
    }
    await this._openGroupRow(fixture, groupName, overlayContainerElement);
    await this._clickChildRowGroup(fixture, rowIndex, overlayContainerElement);

    fixture.detectChanges();
    await fixture.whenStable();
  }

  static async clickGroupByIndex(
    fixture: ComponentFixture<any>,
    groupIndex: number,
  ): Promise<void> {
    const elements = getElementsBySelector(fixture, `.ag-group-value`);
    elements[groupIndex].nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  private static async _handleRegularRowClick(
    fixture: ComponentFixture<any>,
    value: string,
  ): Promise<void> {
    const elements = getElementsBySelector(fixture, `.ag-cell-value .cell-wrapper`);
    for (const elem of elements) {
      if (elem.nativeElement.innerText.startsWith(value)) {
        elem.nativeElement.click();
        fixture.detectChanges();
        await fixture.whenStable();
        return;
      }
    }
  }

  private static async _openGroupRow(
    fixture: ComponentFixture<any>,
    groupName: string,
    overlayContainerElement?: HTMLElement,
  ): Promise<void> {
    const elements = getElementsBySelector(
      fixture,
      `.ag-group-contracted`,
      overlayContainerElement,
    );
    for (const elem of elements) {
      const searchElem = elem.nativeElement.parentElement.querySelector('.ag-group-value');
      if (searchElem.innerText.startsWith(groupName)) {
        elem.nativeElement.click();
        fixture.detectChanges();
        await fixture.whenStable();
        return;
      }
    }
  }

  private static async _clickChildRowGroup(
    fixture: ComponentFixture<any>,
    rowIndex: number,
    overlayContainerElement?: HTMLElement,
  ): Promise<void> {
    const selector = `.ag-row-group-leaf-indent .ag-group-value`;
    await waitForElement(fixture, selector, 10, overlayContainerElement);
    const elements = getElementsBySelector(fixture, selector, overlayContainerElement);
    elements[rowIndex].nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    await MeAgTableHarness.waitForLoadingToFinished(fixture);
  }

  private static async _handleGroupRowClick(
    fixture: ComponentFixture<any>,
    value: string,
    groupIndex: number,
    preventClickChildGroup = false,
  ): Promise<void> {
    //open group
    let elements = getElementsBySelector(fixture, `.ag-group-contracted`);
    elements[groupIndex].nativeElement.click();
    fixture.detectChanges();
    await MeAgTableHarness.waitForLoadingToFinished(fixture);

    if (preventClickChildGroup) {
      return;
    }
    //click child group row
    elements = getElementsBySelector(fixture, `.ag-row-group-leaf-indent .ag-group-value`);
    for (const elem of elements) {
      if (elem.nativeElement.innerText.startsWith(value)) {
        elem.nativeElement.click();
        return;
      }
    }

    // click the 1st child group row
    await this.clickRow(fixture, groupIndex + 1);
  }
}

export abstract class MeDialogHarness {
  static async getText(fixture: ComponentFixture<any>, docLoader: HarnessLoader): Promise<string> {
    const matDialogHarness = await docLoader.getHarness(MatDialogHarness);
    const host = await matDialogHarness.host();
    return host.text();
  }
}

export abstract class MeTabGroupHarness {
  static async selectTab(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    tabGroupHarnessFilters: TabGroupHarnessFilters,
    tabHarnessFilters: TabHarnessFilters,
  ): Promise<MatTabGroupHarness> {
    const tabGroupHarness = await loader.getHarness<MatTabGroupHarness>(
      MatTabGroupHarness.with(tabGroupHarnessFilters),
    );
    await tabGroupHarness.selectTab(tabHarnessFilters);
    fixture.detectChanges();
    return tabGroupHarness;
  }
}

export abstract class MeExpansionPanelHarness {
  static async expand(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: ExpansionPanelHarnessFilters,
  ): Promise<MatExpansionPanelHarness> {
    const expansionPanelHarness = await loader.getHarness<MatExpansionPanelHarness>(
      MatExpansionPanelHarness.with(filters),
    );
    await expansionPanelHarness.expand();

    fixture.detectChanges();
    await fixture.whenStable();

    return expansionPanelHarness;
  }
}

export abstract class MeMenuItemHarness {
  static async click(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: MenuItemHarnessFilters,
  ): Promise<MatMenuItemHarness> {
    const menuItemHarness = await loader.getHarness<MatMenuItemHarness>(
      MatMenuItemHarness.with(filters),
    );
    await menuItemHarness.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return menuItemHarness;
  }
}

export abstract class MeDateHarness {
  static async getCalenderHarness(
    fixture: ComponentFixture<any>,
    loader: HarnessLoader,
    filters: DatepickerToggleHarnessFilters,
  ): Promise<MatCalendarHarness> {
    const datepickerToggleHarness = await loader.getHarness<MatDatepickerToggleHarness>(
      MatDatepickerToggleHarness.with(filters),
    );
    await datepickerToggleHarness.openCalendar();
    return await datepickerToggleHarness.getCalendar();
  }
}

export abstract class MeToggleHarness {
  static async check(
    loader: HarnessLoader,
    filters: SlideToggleHarnessFilters,
  ): Promise<MatSlideToggleHarness> {
    const toggleHarness = await loader.getHarness<MatSlideToggleHarness>(
      MatSlideToggleHarness.with(filters),
    );
    await toggleHarness.toggle();
    return toggleHarness;
  }
}
