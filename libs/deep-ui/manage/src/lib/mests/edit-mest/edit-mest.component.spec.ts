import {ActivatedRoute} from '@angular/router';
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

import {EditMestComponent} from './edit-mest.component';

describe('EditMestComponent', () => {
  let spectator: Spectator<EditMestComponent>;
  let mestService: SpyObject<MestService>;

  const createComponent = createComponentFactory({
    component: EditMestComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      MestFormComponent,
      MeErrorFeedbackComponent,
    ],
    detectChanges: false,
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              mest: {
                nickname: 'some name',
              },
            },
          },
        },
      },
    ],
    mocks: [MestService, MeTourService],
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
      mestService.update.and.returnValue(
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
      mestService.update.and.returnValue(of(null));
      const mest: MestFormStateEvent = {
        mest: getFakeMEST(true),
      };
      spectator.detectChanges();

      spectator.component.onMestFormChanged(mest);

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });
  });
});
