import {Injectable} from '@angular/core';

export enum BroadcastNameEnum {
  New_Version_Indicator = 'New Version Indicator',
}

@Injectable()
export class MeBroadcastService {
  private broadcastsMap: Map<string, BroadcastChannel>;

  constructor() {
    this.broadcastsMap = new Map<string, BroadcastChannel>();
  }

  createBroadcast(broadcastName: string): BroadcastChannel {
    let broadcast = this.broadcastsMap.get(broadcastName);
    if (!broadcast) {
      this.broadcastsMap.set(broadcastName, new BroadcastChannel(broadcastName));
      broadcast = this.broadcastsMap.get(broadcastName);
    }

    return broadcast;
  }

  postMessage(broadcastName: string, msg: any): void {
    this.broadcastsMap.get(broadcastName).postMessage(msg);
  }

  onMessage(broadcastName: string, msgCallback: (ev: MessageEvent) => void): void {
    this.broadcastsMap.get(broadcastName).onmessage = msgCallback;
  }
}
