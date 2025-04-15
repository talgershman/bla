import {Injectable} from '@angular/core';
import {
  MeTourActionClickElement,
  MeTourActionPasteText,
  MeTourActionSetText,
} from '@mobileye/material/src/lib/common';
import Typewriter from 'typewriter-effect/dist/core';

import {MeTour} from './tour.service';

export type TypeWriterAction = MeTourActionPasteText | MeTourActionSetText;

@Injectable()
export class MeTourActionManager {
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
    const {typeWriter} = this._handleTypeWriterAction(action, currentTour);
    typeWriter
      .typeString(action.text)
      .pauseFor(250)
      .callFunction(async () => {
        await afterActionDone();
      })
      .start();
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
    const {typeWriter} = this._handleTypeWriterAction(action, currentTour);
    typeWriter
      .pasteString(action.text)
      .pauseFor(250)
      .callFunction(async () => {
        await afterActionDone();
      })
      .start();
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

  private _handleTypeWriterAction(
    action: TypeWriterAction,
    currentTour: MeTour
  ): {inputElement: HTMLInputElement; typeWriter: Typewriter} {
    const inputElement = this.getInputElement(action.inputSelector);
    inputElement.focus();
    inputElement.value = '';
    const typeWriter = new Typewriter(inputElement, {
      loop: false,
      onCreateTextNode: (character: string) => {
        if (currentTour?.status === 'in_progress') {
          inputElement.value = inputElement.value + character;
        }
      },
      delay: 75,
    });
    return {inputElement, typeWriter};
  }
}
