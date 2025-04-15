import {ReactiveFormsModule} from '@angular/forms';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  MestFormComponent,
  MestFormStateEvent,
} from 'deep-ui/shared/components/src/lib/forms/mest-form';
import {MestService} from 'deep-ui/shared/core';
import {getFakeMEST} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {MestsStepComponent} from './mests-step.component';

describe('MestsStepComponent', () => {
  let spectator: Spectator<MestsStepComponent>;
  let mestService: SpyObject<MestService>;
  let mestsArr: any;

  const createComponent = createComponentFactory({
    component: MestsStepComponent,
    imports: [MestFormComponent, ReactiveFormsModule],
    mocks: [MestService, MeAzureGraphService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    mestService = spectator.inject(MestService);
    const fakeMest1: any = getFakeMEST(true);
    const fakeMest2: any = getFakeMEST(true);
    mestsArr = [fakeMest1, fakeMest2];
    mestService.getAgGridMulti.and.returnValue(
      of({
        rowData: mestsArr,
        rowCount: mestsArr.length,
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onActionClicked', () => {
    it('action open mest form', () => {
      spyOn(spectator.component.stepLabelChange, 'emit');
      spyOn(spectator.component.showMestForm, 'emit');
      const mest: any = {
        nickname: 'some_mest',
      };
      const action: any = {
        id: 'open_mest_form',
        selected: mest,
      };
      spectator.detectChanges();

      spectator.component.onActionClicked(action);

      expect(spectator.component.selectedMest).toEqual(mest);
      expect(spectator.component.showMestFormView).toBeTrue();
      expect(spectator.component.showMestForm.emit).toHaveBeenCalled();
      expect(spectator.component.stepLabelChange.emit).toHaveBeenCalledWith('Override MEST CMD');
    });
  });

  describe('onMestFormBackClicked', () => {
    it('should hide mest form and show mest list', () => {
      spyOn(spectator.component.returnFromMestFormClicked, 'emit');
      spyOn(spectator.component.showMestForm, 'emit');
      spectator.detectChanges();

      spectator.component.onMestFormBackClicked();

      expect(spectator.component.showMestFormView).toBeFalse();
      expect(spectator.component.showMestForm.emit).toHaveBeenCalled();
      expect(spectator.component.returnFromMestFormClicked.emit).toHaveBeenCalled();
    });
  });

  describe('onMestValueChange', () => {
    it('should not mark as override', () => {
      spyOn(spectator.component.showMestForm, 'emit');
      const eventMest = {...mestsArr[1]};
      const event: MestFormStateEvent = {
        mest: eventMest,
      };
      spectator.detectChanges();

      spectator.component.onMestValueChange(event);

      expect(mestsArr[1].isOverride).toBeUndefined();
      expect(spectator.component.showMestForm.emit).toHaveBeenCalled();
      expect(spectator.component.showMestFormView).toBeFalse();
    });

    it('should go to mest form', () => {
      spyOn(spectator.component.showMestForm, 'emit');
      const eventMest = {...mestsArr[1]};
      eventMest.nickname = 'override nickname';
      const event: MestFormStateEvent = {
        mest: eventMest,
      };
      spectator.detectChanges();

      spectator.component.onMestValueChange(event);

      expect(spectator.component.showMestForm.emit).toHaveBeenCalled();
      expect(spectator.component.showMestFormView).toBeFalse();
    });
  });

  describe('onMestsSelectedChanged', () => {
    it('should set mestControl', () => {
      spectator.detectChanges();
      spyOn(spectator.component.mestForm.controls.mest, 'setValue');
      const fakeValidMests: any = [];

      spectator.component.onMestsSelectedChanged(fakeValidMests);

      expect(spectator.component.mestForm.controls.mest.setValue).toHaveBeenCalled();
    });
  });
});
