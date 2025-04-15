import {MeColDef} from '@mobileye/material/src/lib/components/ag-table/entities';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeServerSideTableService} from './server-side-table.service';

const columns: Array<MeColDef<any>> = [
  {
    field: 'jobUuid',
    headerName: 'Job ID',
    filterParams: {
      filterOptions: ['contains'],
      buttons: ['clear'],
      maxNumConditions: 1,
    },
    hide: true,
  },
  {
    field: 'probeName',
    headerName: 'ETL Name',
    filterParams: {
      filterOptions: ['contains'],
      buttons: ['clear'],
      maxNumConditions: 1,
    },
    cellRenderer: 'meAgTemplateRendererComponent',
  },
  {
    field: 'fullName',
    headerName: 'Triggered By',
    filterParams: {
      filterOptions: ['equals'],
      buttons: ['clear'],
      maxNumConditions: 1,
    },
  },
  {
    field: 'jobType',
    headerName: 'Type',
    filter: 'meAgSelectFilterComponent',
    filterParams: {
      filterOptions: ['equals'],
      buttons: ['clear'],
      filterPlaceholder: 'Type',
      values: [{id: 'v1', value: 'v1'}],
      maxNumConditions: 1,
    },
  },
];

describe('MeServerSideTableService', () => {
  let spectator: SpectatorService<MeServerSideTableService>;

  const createService = createServiceFactory({
    service: MeServerSideTableService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should create', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should load server modules', async () => {
    const modules = await spectator.service.loadServerModules({
      masterDetail: true,
      rowGrouping: false,
    });

    expect(modules.length).toBe(5);
  });

  it('should load server components', async () => {
    const components = await spectator.service.loadServerComponents(columns);

    expect(components.length).toBe(3);
  });
});
