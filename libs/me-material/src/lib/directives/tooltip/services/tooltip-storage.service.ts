import {Injectable} from '@angular/core';
import {
  InstanceChangeReason,
  InstanceChangeReasonEnum,
  InstancesChanges,
  MeTippyInstance,
} from '@mobileye/material/src/lib/directives/tooltip/common';
import {Observable, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MeTooltipStorageService {
  tippyInstances: Map<string, MeTippyInstance> = new Map();
  private tippyInstances$ = new Subject<InstancesChanges>();
  /**
   * Working with storage
   */

  /**
   * Write tippy instances to storage
   *
   * @param name { string } name of tippy instance
   * @param state { MeTippyInstance } tippy instance
   */
  setInstance(name: string, state: MeTippyInstance): void {
    this.tippyInstances.set(name, state);
    this.emitInstancesChange({
      name,
      reason: InstanceChangeReasonEnum.SetInstance,
      instance: state,
    });
  }

  /**
   * Get specific tippy instance
   *
   * @param name { string } name of tippy instance
   * @returns { MeTippyInstance | null } specific tippy instance or null
   */
  getInstance(name: string): MeTippyInstance | null {
    //eslint-disable-next-line
    return this.tippyInstances.has(name) ? this.tippyInstances.get(name)! : null;
  }

  /**
   * Get all tippy instances from storage
   *
   * @returns { Map<string, MeTippyInstance> | null } all tippy instances or null
   */
  getInstances(): Map<string, MeTippyInstance> | null {
    return this.tippyInstances.size ? this.tippyInstances : null;
  }

  /**
   * Subscription to change of tippy instances
   *
   * @returns { Observable<InstancesChanges> } observable of tippy instances change
   */
  get instancesChanges(): Observable<InstancesChanges> {
    return this.tippyInstances$.asObservable();
  }

  /**
   * Emit the recent change object
   * @param name { string } name of tippy instance
   * @param reason { InstanceChangeReason } reason of change
   * @param instance { MeTippyInstance } tippy instance
   */
  emitInstancesChange({
    name,
    reason,
    instance,
  }: {
    reason: InstanceChangeReason;
    name: string;
    instance: MeTippyInstance;
  }): void {
    this.tippyInstances$.next({name, reason, instance});
  }
}
