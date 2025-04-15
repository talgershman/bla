import {ICellRendererAngularComp} from '@ag-grid-community/angular';
import {NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  signal,
  TemplateRef,
} from '@angular/core';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeDetailCellRendererParams} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

const CUSTOM_DETAIL_REFRESH_INTERVAL = 30000;

@UntilDestroy()
@Component({
  selector: 'me-ag-custom-detail',
  templateUrl: './ag-custom-detail.component.html',
  styleUrls: ['./ag-custom-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  animations: [MeFadeInOutAnimation],
})
export class MeAgCustomDetailComponent<T> implements ICellRendererAngularComp, OnDestroy {
  private cd = inject(ChangeDetectorRef);
  private timerService = inject(MeTimerService);

  template: TemplateRef<any>;
  templateContext: {
    $implicit: T;
    params: MeDetailCellRendererParams<T>;
  };
  data: T;

  private interval: number;
  private onDestroy: Pick<MeDetailCellRendererParams<T>, 'onDestroyed'>['onDestroyed'];

  show = signal(false);

  ngOnDestroy(): void {
    clearInterval(this.interval);
    if (this.onDestroy) {
      this.onDestroy(this.data);
    }
  }

  refresh(params: MeDetailCellRendererParams<T>): boolean {
    this.data = params.data;
    this.templateContext = {
      $implicit: this.data,
      params: {...params},
    };

    this.cd.detectChanges();
    return true;
  }

  agInit(params: MeDetailCellRendererParams<T>): void {
    if (params.onOpen) {
      const onOpenKey = 'onOpen';
      params.node.parent[onOpenKey] = params.onOpen;
    }
    if (params.onDestroyed) {
      this.onDestroy = params.onDestroyed;
    }

    this._setTemplateAndRefresh(params);

    // Only when data is updated in the table using Transaction Updates,
    // the ag-grid will call refresh on Detail Cell Renderer's.
    // Instead, we use setInterval to call refreshCells periodically,
    // refreshCells will call refresh.
    this.interval = window.setInterval(() => {
      if (params.node.parent?.expanded) {
        params.api.refreshCells({rowNodes: [params.node]});
      }
    }, CUSTOM_DETAIL_REFRESH_INTERVAL);

    this.timerService
      .timer(300)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.show.set(true);
      });
  }

  private _setTemplateAndRefresh(params: MeDetailCellRendererParams<T>): void {
    this.template = params.meTemplate;
    this.refresh(params);
  }
}
