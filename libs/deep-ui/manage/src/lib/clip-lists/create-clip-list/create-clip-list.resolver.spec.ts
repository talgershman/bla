import {ActivatedRoute, Router, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';

import {CreateClipListResolver} from './create-clip-list.resolver';
import createSpyObj = jasmine.createSpyObj;
import {getFakeClipList} from 'deep-ui/shared/testing';

const fakeClipList = getFakeClipList(true);

const fakeFile = new File(['file content'], 'fake file name');

describe('CreateClipListResolver', () => {
  let spectator: SpectatorHttp<CreateClipListResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;

  const createHttp = createHttpFactory({
    service: CreateClipListResolver,
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {},
        },
      },
      {
        provide: Router,
        useValue: {
          getCurrentNavigation: () => {
            return {
              extras: {
                state: {
                  clipList: fakeClipList,
                  file: fakeFile,
                },
              },
            };
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    route = spectator.inject(ActivatedRoute);
    mockSnapshot = createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
  });

  it('should resolve viewData', () => {
    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect({clipList: fakeClipList, file: fakeFile, startTour: undefined}).toEqual(data);
    });
  });
});
