import {
  CONTAINS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DESCRIPTION_COL_DEF,
  getStatusColDef,
  getTeamColDef,
  getTechnologyColDef,
  ID_COL_DEF,
  MODIFIED_AT_COL_DEF,
  PERFECT_LIST_COUNT_COL_DEF,
  PerfectListStatusTypes,
} from 'deep-ui/shared/components/src/lib/common';
import {PerfectList} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export const getSelectPerfectListTableColumns: (
  options: MeColumnsOptions,
) => MeColDef<PerfectList>[] = (options: MeColumnsOptions) =>
  [
    ID_COL_DEF,
    {
      field: 'sync',
      width: 80,
      resizable: false,
      suppressColumnsToolPanel: true,
      sortable: false,
      filter: false,
      headerComponentParams: {
        showNumberOfSelections: true,
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.syncCell,
      },
    },
    {
      field: 'name',
      minWidth: 200,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.nameCell,
      },
    },
    ...getTeamColDef('team'),
    getStatusColDef(
      options,
      PerfectListStatusTypes.map((status) => {
        return {
          value: _startCase(status),
          id: status,
        };
      }) as MeSelectOption[],
    ),
    CREATED_BY_USER_NAME_COL_DEF,
    CREATED_BY_COL_DEF,
    getTechnologyColDef(options, false),
    PERFECT_LIST_COUNT_COL_DEF,
    DESCRIPTION_COL_DEF,
    MODIFIED_AT_COL_DEF,
  ] as MeColDef<PerfectList>[];
