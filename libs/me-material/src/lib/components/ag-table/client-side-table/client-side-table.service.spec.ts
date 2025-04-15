import {MeColDef} from '@mobileye/material/src/lib/components/ag-table/entities';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeClientSideTableService} from './client-side-table.service';

const columns: Array<MeColDef<any>> = [
  {
    field: 'id',
    filterParams: {
      filterOptions: ['contains'],
      buttons: ['clear'],
      maxNumConditions: 1,
    },
    hide: true,
  },
  {
    field: 'name',
    filterParams: {
      filterOptions: ['contains'],
      buttons: ['clear'],
      maxNumConditions: 1,
    },
  },
  {
    field: 'team',
    filter: false,
  },
  {
    field: 'type',
    filter: 'meAgSelectFilterComponent',
    filterParams: {
      filterOptions: ['equals'],
      buttons: ['clear'],
      filterPlaceholder: 'Type',
      values: [],
      maxNumConditions: 1,
    },
  },
];

describe('MeClientSideTableService', () => {
  let spectator: SpectatorService<MeClientSideTableService>;

  const createService = createServiceFactory({
    service: MeClientSideTableService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should create', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should load client modules', async () => {
    const modules = await spectator.service.loadClientModules({
      masterDetail: false,
      rowGrouping: false,
    });

    expect(modules.length).toBe(4);
  });

  it('should load client components', async () => {
    const components = await spectator.service.loadClientComponents(columns);

    expect(components.length).toBe(2);
  });
});
