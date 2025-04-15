import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterEvent,
} from '@angular/router';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {ReplaySubject} from 'rxjs';

import {MeRouteService} from './route.service';

describe('MeRouteService', () => {
  let spectator: SpectatorService<MeRouteService>;
  let events: ReplaySubject<RouterEvent>;

  const createService = createServiceFactory({
    service: MeRouteService,
    mocks: [MeRouteService],
  });

  beforeEach((): void => {
    events = new ReplaySubject<RouterEvent>(1);
    spectator = createService({
      providers: [
        {
          provide: Router,
          useValue: {
            events: events.asObservable(),
          },
        },
      ],
    });
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('Should show loader - NavigationStart', (done) => {
    const start = new NavigationStart(1, 'regular');

    events.next(start);

    spectator.service.routeLoading$.subscribe((value: boolean) => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('Should hide loader - NavigationEnd', (done) => {
    const end = new NavigationEnd(1, 'regular', 'next');

    events.next(end);

    spectator.service.routeLoading$.subscribe((value: boolean) => {
      expect(value).toBeFalse();
      done();
    });
  });

  it('Should hide loader - NavigationCancel', (done) => {
    const cancel = new NavigationCancel(1, 'regular', 'next');

    events.next(cancel);

    spectator.service.routeLoading$.subscribe((value: boolean) => {
      expect(value).toBeFalse();
      done();
    });
  });

  it('Should hide loader - NavigationError', (done) => {
    const error = new NavigationError(1, 'regular', 'next');

    events.next(error);

    spectator.service.routeLoading$.subscribe((value: boolean) => {
      expect(value).toBeFalse();
      done();
    });
  });
});
