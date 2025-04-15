import {ActivatedRoute, convertToParamMap, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {of} from 'rxjs';

import {EditClipListResolver} from './edit-clip-list.resolver';
import createSpyObj = jasmine.createSpyObj;
import {ClipListService} from 'deep-ui/shared/core';
import {getFakeClipList} from 'deep-ui/shared/testing';

const fakeClipList = getFakeClipList(true);

describe('EditClipListResolver', () => {
  let spectator: SpectatorHttp<EditClipListResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let clipListService: jasmine.SpyObj<ClipListService>;

  const createHttp = createHttpFactory({
    service: EditClipListResolver,
    mocks: [ClipListService],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({
              id: fakeClipList.id,
            }),
            data: fakeClipList,
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    route = spectator.inject(ActivatedRoute);
    clipListService = spectator.inject(ClipListService);
    mockSnapshot = createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
  });

  it('should resolve clip-list', () => {
    clipListService.getSingle.and.returnValue(of(fakeClipList));
    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect(fakeClipList).toEqual(data);
    });
  });
});
