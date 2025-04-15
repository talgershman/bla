import {ChangeDetectorRef, Directive, inject} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';

@Directive()
export class BaseCreateEditEntityDirective<T> {
  // must be override
  backButtonRoute: Array<string>;

  // must be override
  entityName = '';

  errorMsg: string;

  entity: T;

  protected loadingService = inject(MeLoadingService);
  protected router = inject(Router);
  protected activatedRoute = inject(ActivatedRoute);
  protected dialog = inject(MatDialog);
  protected cd = inject(ChangeDetectorRef);

  onBackButtonPressed(entity?: T): void {
    const selected = entity || this.entity;
    this.router.navigate(this.backButtonRoute, {
      state: selected ? {selected} : {},
    });
  }

  protected getEntity(): T {
    if (this.activatedRoute.snapshot.data.entity) {
      return this.activatedRoute.snapshot.data.entity;
    }
    return this.router.getCurrentNavigation()?.extras.state
      ? this.router.getCurrentNavigation().extras.state?.selected ||
          this.router.getCurrentNavigation().extras.state[this.entityName]
      : {};
  }
}
