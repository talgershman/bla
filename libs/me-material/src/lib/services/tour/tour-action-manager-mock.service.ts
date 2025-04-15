import {Injectable} from '@angular/core';
import {
  MeTourActionClickElement,
  MeTourActionPasteText,
  MeTourActionSetText,
} from '@mobileye/material/src/lib/common';
import Typewriter from 'typewriter-effect/dist/core';

import {MeTour} from './tour.service';

@Injectable()
export class MeTourActionManagerMock {
  private typeWriterInstance?: Typewriter;

  get typeWriter(): Typewriter {
    return this.typeWriterInstance;
  }

  stopTypeWriter(): void {
    this.typeWriterInstance?.stop();
  }

  clearTypeWriter(): void {
    if (this.typeWriterInstance) {
      this.stopTypeWriter();
      this.typeWriterInstance = null;
    }
  }

  async handleTypeAction(
    action: MeTourActionSetText,
    currentTour: MeTour,
    afterActionDone: Function
  ): Promise<void> {
    const elem = this.getInputElement(action.inputSelector);
    elem.value = action.text;
    await afterActionDone();
  }

  async handleClickElementAction(
    action: MeTourActionClickElement,
    afterActionDone: Function
  ): Promise<void> {
    const selectorElem = document.querySelector<HTMLElement>(action.controlSelector);
    if (selectorElem) {
      selectorElem.click();
      await afterActionDone();
    }
  }

  async handleCopyAction(
    action: MeTourActionPasteText,
    currentTour: MeTour,
    afterActionDone: Function
  ): Promise<void> {
    const elem = this.getInputElement(action.inputSelector);
    elem.value = action.text;
    await afterActionDone();
  }

  waitForPromise(time: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  getInputElement(inputSelector: string): HTMLInputElement {
    const inputElement: HTMLInputElement = document.querySelector(
      inputSelector
    ) as HTMLInputElement;
    if (!inputElement) {
      throw new Error('Input selector not found!');
    }
    return inputElement;
  }
}
