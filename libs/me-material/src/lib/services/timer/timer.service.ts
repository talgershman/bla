import {Injectable} from '@angular/core';
import {interval, Observable, timer} from 'rxjs';

@Injectable()
export class MeTimerService {
  constructor() {}
  interval(ms: number): Observable<number> {
    return interval(ms);
  }

  timer(startDueMs: number, intervalMs?: number): Observable<number> {
    if (intervalMs === undefined) {
      return timer(startDueMs);
    }
    return timer(startDueMs, intervalMs);
  }
}
