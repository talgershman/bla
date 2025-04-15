import {Injectable} from '@angular/core';
import {BehaviorSubject, of, timer} from 'rxjs';
import {delayWhen, distinctUntilChanged} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MeLoadingService {
  // eslint-disable-next-line
  private loading = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  loading$ = this.loading.asObservable().pipe(
    distinctUntilChanged(),
    delayWhen((isLoading) => (!isLoading ? timer(300) : of(undefined)))
  );

  showLoader(): void {
    this.loading.next(true);
  }

  hideLoader(): void {
    this.loading.next(false);
  }
}
