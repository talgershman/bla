import {ActivatedRoute, RouterStateSnapshot} from "@angular/router";
import {createHttpFactory, SpectatorHttp, SpyObject} from "@ngneat/spectator";
import {AssetManagerService, ClipListService} from "deep-ui/shared/core";

import {IndexClipListResolver} from "./index-clip-list.resolver";
import createSpyObj = jasmine.createSpyObj;
import {fakeTechnology} from "deep-ui/shared/testing";
import {of} from "rxjs";

describe('IndexClipListResolver', () => {
  let spectator: SpectatorHttp<IndexClipListResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let assetManagerService: SpyObject<AssetManagerService>;

  const createHttp = createHttpFactory({
    service: IndexClipListResolver,
    mocks: [ClipListService, AssetManagerService],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              viewData: {
                technologiesOptions: fakeTechnology,
              },
            },
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    route = spectator.inject(ActivatedRoute);
    assetManagerService = spectator.inject(AssetManagerService);
    mockSnapshot = createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
  });

  it('should resolve technologiesOptions', (done) => {
    const techOptions = [{id: 'AV', value: 'AV'}];
    assetManagerService.getTechnologiesOptions.and.returnValue(of(techOptions));
    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect(techOptions).toEqual(data.technologiesOptions);
      done();
    });
  });
});
