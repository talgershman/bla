import {HarnessLoader} from '@angular/cdk/testing';
import {DebugElement} from '@angular/core';
import {ComponentFixture, DeferBlockState} from '@angular/core/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {By} from '@angular/platform-browser';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';

export const getElementsBySelector = (
  fixture: ComponentFixture<any>,
  selector: string,
  overlayContainerElement?: HTMLElement,
): DebugElement[] => {
  if (overlayContainerElement) {
    const targetElems = overlayContainerElement.querySelectorAll(selector);
    if (!targetElems?.length) {
      return [];
    }
    return Array.from(targetElems).map((elem: Element) => new DebugElement(elem));
  }
  return fixture.debugElement.queryAll(By.css(selector));
};

export const getElementBySelector = (
  fixture: ComponentFixture<any>,
  selector: string,
  overlayContainerElement?: HTMLElement,
): DebugElement => {
  if (overlayContainerElement) {
    const targetElem = overlayContainerElement.querySelector(selector);
    if (!targetElem) {
      return null;
    }
    return new DebugElement(targetElem);
  }
  return fixture.debugElement.query(By.css(selector));
};

export const getValuesBySelector = (fixture: ComponentFixture<any>, selector: string): string[] => {
  const result = [];
  const elements = getElementsBySelector(fixture, selector);
  if (!elements) {
    return [];
  }
  elements.forEach((elem) => {
    result.push(elem.nativeElement.innerText);
  });

  return result;
};

export const getFakeMouseEvent = (type = 'click'): MouseEvent => {
  return new MouseEvent(type, {
    view: window,
    bubbles: true,
    cancelable: true,
  });
};

export const fakeFile = (filename: string): File => {
  const blob = new Blob([''], {type: 'text/html'});
  return new File([blob], filename, {type: 'text/html'});
};

export const waitForElement = (
  fixture: ComponentFixture<any>,
  selector: string,
  maxRetries = 10,
  overlayContainerElement?: HTMLElement,
): Promise<void> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>(async (resolve, reject) => {
    let retries = 0;

    const checkElement = () => {
      const element = getElementBySelector(fixture, selector, overlayContainerElement);
      retries++;
      if (element) {
        resolve();
      } else if (retries < maxRetries) {
        requestIdleCallback(checkElement, {timeout: 200});
      } else {
        reject(new Error(`waitForElement - Exceeded maximum retries (${maxRetries})`));
      }
    };

    checkElement();
  });
};

export const waitForDeferredBlocks = async (fixture: ComponentFixture<any>): Promise<void> => {
  const deferBlocksFixture = await fixture.getDeferBlocks();
  for (const block of deferBlocksFixture) {
    await block.render(DeferBlockState.Complete);
  }
};

export const getButtonByText = async (
  loader: HarnessLoader,
  text: string,
): Promise<MatButtonHarness> => {
  const buttonsElements = await loader.getAllHarnesses<MatButtonHarness>(MatButtonHarness);
  for (const elem of buttonsElements) {
    const buttonText = await elem.getText();
    if (buttonText === text) {
      return elem;
    }
  }
  return null;
};

export class DropFileEventMock {
  files: NgxFileDropEntry[] = new Array<NgxFileDropEntry>();

  constructor(fileName: string) {
    const drop = this.createDrop(fileName);
    this.files.push(drop);
  }

  getFiles(): any {
    return this.files;
  }

  private createDrop(fileName: string): NgxFileDropEntry {
    const file: FileSystemFileEntry = {
      name: fileName,
      isDirectory: false,
      isFile: true,
      file: <T>(callback: (file: File) => T) => callback(fakeFile(file.name) as File),
    };
    return new NgxFileDropEntry('', file);
  }
}
