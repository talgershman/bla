import {RowGroupingDisplayType} from '@ag-grid-community/core';
import {EventEmitter} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

import {MeAgTableActionItemEvent} from './ag-table-entities';

export interface MeAgContextService {
  isLoading: BehaviorSubject<boolean>;
}

export interface MeActionsBaseTableDirective<T> {
  tableApiService: MeAgContextService;
  rowSelection: 'single' | 'multiple';
  numberOfSelectedNodes$: Observable<number>;
  actionClicked: EventEmitter<MeAgTableActionItemEvent<T>>;
  groupDisplayType?: RowGroupingDisplayType;
  onActionClicked(event: MeAgTableActionItemEvent<T>): void;
  onNoRows(): void;
}
