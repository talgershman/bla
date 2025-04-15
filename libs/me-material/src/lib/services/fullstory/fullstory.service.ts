import {Injectable} from '@angular/core';
import {FullStory} from '@fullstory/browser';
import {V2OperationOptions} from '@fullstory/snippet';

type LogLevel = 'log' | 'error' | 'info' | 'warn';

type LogItem = {
  level: LogLevel;
  msg: string;
};

type PageItem = {
  pageName: string;
  extraData?: Record<string, any>;
};

@Injectable({
  providedIn: 'root',
})
export class FullStoryService {
  private queueEvents: Array<V2OperationOptions['trackEvent']> = [];
  private logsEvents: Array<LogItem> = [];
  private pageEvents: Array<PageItem> = [];
  private isActive = false;
  private isDisabled: boolean;

  setFullStoryToActive(): void {
    this.isActive = true;
  }

  isFullStoryActive(): boolean {
    return this.isActive;
  }

  startCapture(): void {
    FullStory('start');
  }

  setDisableService(disable: boolean): void {
    this.isDisabled = disable;
  }

  flushAll(): void {
    if (this.isDisabled) {
      return;
    }
    this._flushPageEventsQueue();
    this._flushLogEventsQueue();
    this._flushEventsQueue();
  }

  _flushEventsQueue(): void {
    for (const event of this.queueEvents) {
      this.trackEvent(event);
    }
    this.queueEvents = [];
  }

  private _flushPageEventsQueue(): void {
    for (const page of this.pageEvents) {
      this.setPage(page);
    }
    this.pageEvents = [];
  }

  _flushLogEventsQueue(): void {
    for (const item of this.logsEvents) {
      this.log(item);
    }
    this.logsEvents = [];
  }

  log(item: LogItem): void {
    if (this.isDisabled) {
      return;
    }
    if (this.isActive) {
      FullStory('log', item as any);
    } else {
      this.logsEvents.push(item);
    }
  }

  trackEvent(item: V2OperationOptions['trackEvent']): void {
    if (this.isDisabled) {
      return;
    }
    if (this.isActive) {
      FullStory('trackEvent', item);
    } else {
      this.queueEvents.push(item);
    }
  }

  setPage(pageItem: PageItem): void {
    if (this.isDisabled) {
      return;
    }
    if (this.isActive) {
      FullStory('setProperties', {
        type: 'page',
        properties: {
          ...pageItem,
        },
      });
    } else {
      this.pageEvents.push(pageItem);
    }
  }

  async getCurrentSessionId(): Promise<string> {
    if (this.isDisabled) {
      return Promise.resolve('');
    }
    return await FullStory('getSession', {format: 'id'});
  }

  async getCurrentSessionUrl(): Promise<string> {
    if (this.isDisabled) {
      return Promise.resolve('');
    }
    return await FullStory('getSessionAsync', {format: 'url.now'});
  }
}
