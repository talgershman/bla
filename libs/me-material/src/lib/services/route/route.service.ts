import {inject, Injectable} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

@Injectable()
export class MeRouteService {
  private router = inject(Router);

  // eslint-disable-next-line
  private routeLoading = new BehaviorSubject<boolean>(false);
  // eslint-disable-next-line
  routeLoading$ = this.routeLoading.asObservable().pipe(distinctUntilChanged());

  constructor() {
    this.registerRouterEvents();
  }

  registerRouterEvents(): void {
    this.router.events.subscribe((event) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.routeLoading.next(true);
          break;
        }
        case event instanceof NavigationEnd:
        case event instanceof NavigationCancel:
        case event instanceof NavigationError: {
          this.routeLoading.next(false);
          break;
        }
        default: {
          break;
        }
      }
    });
  }
}
