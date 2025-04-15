import {ActivatedRoute, convertToParamMap, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {of} from 'rxjs';

import {EditMestResolver} from './edit-mest.resolver';
import createSpyObj = jasmine.createSpyObj;
import {MestService} from 'deep-ui/shared/core';
import {MEST} from 'deep-ui/shared/models';

const mestServiceSpy = createSpyObj('MestService', ['getSingle']);
const expectedData: Partial<MEST> = {
  id: 32,
  nickname: 'mest1',
  executables: ['/executables/eyeq4/release/GV_3FOV', '/executables/GV_3FOV'],
  brainLibs: [],
  params: [{key: 'Application=IPB', value: '-sIPBconf=/mobileye/OB:'}],
  args: '',
  createdAt: '2021-03-29T12:05:09.651143+03:00',
  modifiedAt: '2021-03-29T12:05:09.647530+03:00',
};

describe('EditMestResolver', () => {
  let spectator: SpectatorHttp<EditMestResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;

  const createHttp = createHttpFactory({
    service: EditMestResolver,
    providers: [
      {provide: MestService, useValue: mestServiceSpy},
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({
              id: expectedData.id,
            }),
            data: expectedData,
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

  it('should resolve mest', () => {
    mestServiceSpy.getSingle.and.returnValue(of(expectedData));
    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect(expectedData).toEqual(data);
    });
  });
});
