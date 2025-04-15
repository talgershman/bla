import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';

import {AgDatasourceService} from './ag-datasource.service';

describe('AgDatasourceService', () => {
  let spectator: SpectatorHttp<AgDatasourceService>;

  const createHttp = createHttpFactory({
    service: AgDatasourceService,
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getMulti', () => {
    it('should be created', () => {
      spectator.service
        .getMulti('perfects', {
          pivotCols: [],
          pivotMode: false,
          valueCols: [],
          startRow: 0,
          endRow: 25,
          rowGroupCols: [],
          groupKeys: [],
          filterModel: {},
          sortModel: [],
        })
        .subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/datasources/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
