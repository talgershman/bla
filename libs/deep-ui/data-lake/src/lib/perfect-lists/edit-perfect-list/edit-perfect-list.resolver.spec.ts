import {ActivatedRoute, convertToParamMap, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {PerfectListService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {EditPerfectListResolver} from './edit-perfect-list.resolver';
import createSpyObj = jasmine.createSpyObj;
import {getFakePerfectList} from 'deep-ui/shared/testing';

const fakePerfectList = getFakePerfectList(true);

describe('EditPerfectListResolver', () => {
  let spectator: SpectatorHttp<EditPerfectListResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let perfectListService: SpyObject<PerfectListService>;

  const createHttp = createHttpFactory({
    service: EditPerfectListResolver,
    mocks: [PerfectListService],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({
              id: fakePerfectList.id,
            }),
            data: fakePerfectList,
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    route = spectator.inject(ActivatedRoute);
    perfectListService = spectator.inject(PerfectListService);
    mockSnapshot = createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
  });

  it('should resolve Perfect-list', () => {
    perfectListService.getSingle.and.returnValue(of(fakePerfectList));
    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect(fakePerfectList).toEqual(data);
    });
  });
});
