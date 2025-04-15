import {MeAgTableActionItem} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeChipsGroupButton} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {Datasource} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export enum DataSourceDynamicViewEnum {
  DE_SEARCH = 'DE_SEARCH',
  PERFECTS = 'PERFECTS',
  GOLDEN_LABELS = 'GOLDEN_LABELS',
  MESTS = 'MESTS',
  SIMULATOR = 'SIMULATOR',
  OFFICIAL_DRIVES = 'official_drives',
  ETL_RESULTS = 'ETL_RESULTS',
}

/* The order should match tabs order in template view in - data-source-tables.component */
export const dataSourceGroupButtons: Array<MeChipsGroupButton & {hideInSelectionMode?: boolean}> = [
  {
    label: 'DE-Search',
    id: DataSourceDynamicViewEnum.DE_SEARCH,
  },
  {
    label: 'Perfects',
    id: DataSourceDynamicViewEnum.PERFECTS,
  },
  //todo uncomment when golden labels will be implemented
  {
    label: 'Golden Labels',
    id: DataSourceDynamicViewEnum.GOLDEN_LABELS,
  },
  {
    label: 'Simulator',
    id: DataSourceDynamicViewEnum.SIMULATOR,
  },
  {
    label: 'MEST',
    id: DataSourceDynamicViewEnum.MESTS,
  },
  //todo uncomment when official drives will be implemented
  // {
  //   label: 'Official Drives',
  //   id: DataSourceDynamicViewEnum.OFFICIAL_DRIVES,
  //   hideInSelectionMode: true,
  // },
  {
    label: 'ETL Results',
    id: DataSourceDynamicViewEnum.ETL_RESULTS,
  },
];

export const defaultDataSourceView = DataSourceDynamicViewEnum.PERFECTS;

export const IsDataRetentionActionDisabled = (datasource: Datasource): boolean =>
  !['active', 'frozen', 'needs_sync'].includes(datasource.status);

export const IsUpdateActionDisabled = (datasource: Datasource): boolean =>
  !datasource ||
  datasource.status === 'updating' ||
  datasource.status === 'frozen' ||
  datasource.status === 'inactive' ||
  datasource.status === 'failed' ||
  datasource.status === 'failed_to_delete' ||
  datasource.status === 'broken' ||
  datasource.status === 'creating';

export const IsDataSourceDisabledForAction = (datasource: Datasource): boolean =>
  datasource &&
  datasource.status !== 'active' &&
  datasource.status !== 'needs_sync' &&
  datasource.status !== 'frozen';

export const IsDeleteActionDisabled = (datasource: Datasource): boolean =>
  !datasource ||
  datasource.status === 'updating' ||
  datasource.status === 'creating' ||
  datasource.status === 'failed_to_delete' ||
  datasource.status === 'broken';

export enum DataSourceCustomActions {
  GoToLink = 'go-to-link',
  CreateFromExisting = 'create-from-existing',
  QueryDataSource = 'query-data-source',
  DownloadClipList = 'download-clip-list',
  IshowURL = 'ishow-url',
  UPDATE = 'update',
  DELETE = 'delete',
}

export const GoToLinkTableAction: MeAgTableActionItem<Datasource> = {
  title: 'Go To Creation Job',
  id: DataSourceCustomActions.GoToLink,
  excludeInSelectionMode: true,
};

export const DownloadClipListAction: MeAgTableActionItem<Datasource> = {
  id: DataSourceCustomActions.DownloadClipList,
  title: 'Download Clip List',
  excludeInSelectionMode: true,
  tooltip: (datasource: Datasource) => {
    if (IsDataSourceDisabledForAction(datasource)) {
      return 'Data source is disabled for this status';
    }
    return '';
  },
  isDisabled: IsDataSourceDisabledForAction,
};

export const QueryTableAction: MeAgTableActionItem<Datasource> = {
  title: 'Query Data Source',
  id: DataSourceCustomActions.QueryDataSource,
  excludeInSelectionMode: true,
  tooltip: (datasource: Datasource) => {
    if (IsDataSourceDisabledForAction(datasource)) {
      return 'Data source is disabled for this status';
    }
    return '';
  },
  isDisabled: IsDataSourceDisabledForAction,
};

export const IshowURLAction: MeAgTableActionItem<Datasource> = {
  title: 'Datasource URL',
  tooltip: (datasource: Datasource) => {
    if (IsDataSourceDisabledForAction(datasource)) {
      return 'Data source is disabled for this status';
    }
    return 'Used for iShow input';
  },
  isDisabled: IsDataSourceDisabledForAction,
  id: DataSourceCustomActions.IshowURL,
  excludeInSelectionMode: true,
};

export const CreateFromExistingTableAction: MeAgTableActionItem<Datasource> = {
  title: 'Create From Existing',
  id: DataSourceCustomActions.CreateFromExisting,
  excludeInSelectionMode: true,
};

export const UpdateTableAction: MeAgTableActionItem<Datasource> = {
  title: _startCase(DataSourceCustomActions.UPDATE),
  id: DataSourceCustomActions.UPDATE,
  excludeInSelectionMode: true,
  tooltip: (datasource: Datasource) => {
    if (IsUpdateActionDisabled(datasource)) {
      return 'Data source is disabled for this status';
    }
    return '';
  },
  isDisabled: IsUpdateActionDisabled,
};

export const DeleteTableAction: MeAgTableActionItem<Datasource> = {
  title: _startCase(DataSourceCustomActions.DELETE),
  id: DataSourceCustomActions.DELETE,
  excludeInSelectionMode: true,
  tooltip: (datasource: Datasource) => {
    if (IsDeleteActionDisabled(datasource)) {
      return 'Data source is disabled for this status';
    }
    return '';
  },
  isDisabled: IsDeleteActionDisabled,
};

export const DEFAULT_DATA_SOURCE_VIEW_SESSION_KEY = 'defaultDataSourceView';
