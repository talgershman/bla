import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeTourService} from '@mobileye/material/src/lib/services/tour';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  MestFormComponent,
  MestFormStateEvent,
} from 'deep-ui/shared/components/src/lib/forms/mest-form';
import {MestService} from 'deep-ui/shared/core';
import {getFakeMEST} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {CreateMestComponent} from './create-mest.component';

describe('CreateMestComponent', () => {
  let spectator: Spectator<CreateMestComponent>;
  let mestService: SpyObject<MestService>;

  const createComponent = createComponentFactory({
    component: CreateMestComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      MestFormComponent,
      MeErrorFeedbackComponent,
    ],
    mocks: [MestService, MeTourService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    mestService = spectator.inject(MestService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onMestFormChanged', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      mestService.create.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const mest: MestFormStateEvent = {
        mest: getFakeMEST(true),
      };
      spectator.detectChanges();

      spectator.component.onMestFormChanged(mest);

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should create and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      mestService.create.and.returnValue(of(null));
      const mest: MestFormStateEvent = {
        mest: getFakeMEST(true),
      };
      spectator.detectChanges();

      spectator.component.onMestFormChanged(mest);

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });
  });
});
