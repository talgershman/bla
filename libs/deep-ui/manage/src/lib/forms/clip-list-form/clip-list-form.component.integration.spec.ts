import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {
  MeUploadFileComponent,
  MeUploadFileComponentMock,
} from '@mobileye/material/src/lib/components/upload-file';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeTourService} from '@mobileye/material/src/lib/services/tour';
import {
  DropFileEventMock,
  getElementBySelector,
  MeButtonHarness,
  MeInputHarness,
  MeSelectHarness,
} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {clipListFormTour} from 'deep-ui/shared/configs';
import {AssetManagerService, ClipListService} from 'deep-ui/shared/core';
import {getFakeClipList} from 'deep-ui/shared/testing';
import {NgxFileDropEntry} from 'ngx-file-drop';
import {of} from 'rxjs';

import {ClipListFormComponent} from './clip-list-form.component';

describe('ClipListFormComponent - Integration', () => {
  let spectator: Spectator<ClipListFormComponent>;
  let clipListService: SpyObject<ClipListService>;
  let assetManagerService: SpyObject<AssetManagerService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ClipListFormComponent,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      MeInputComponent,
      MeTextareaComponent,
      MatButtonModule,
      MeSelectComponent,
      MeFormControlChipsFieldComponent,
      MeUploadFileComponent,
      MeTooltipDirective,
    ],
    providers: [MeTourService],
    mocks: [ClipListService, AssetManagerService],
    overrideComponents: [
      [
        MeUploadFileComponent,
        {
          remove: {
            imports: [MeUploadFileComponent],
          },
          add: {
            imports: [MeUploadFileComponentMock],
          },
        },
      ],
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    clipListService = spectator.inject(ClipListService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    assetManagerService = spectator.inject(AssetManagerService);
    assetManagerService.getTechnologiesOptions.and.returnValue(
      of([
        {id: 'AV', value: 'AV'},
        {id: 'TFL', value: 'TFL'},
      ]),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('create new', () => {
    const files: NgxFileDropEntry[] = new DropFileEventMock('some mock file').files;
    it('valid - should create', (done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      (async function () {
        clipListService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
        spectator.component.formMode = 'create';
        spectator.detectChanges();

        // insert name
        await MeInputHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '[title="Name"]'},
          'name 1',
        );
        spectator.component.clipListForm.controls.clipListFile.setValue(files[0]);
        spectator.component.clipListForm.controls.technology.setValue('TFL');
        spectator.component.clipListForm.controls.type.setValue('clip');
        spectator.component.clipListForm.controls.team.setValue('deep-fpa-objects');

        spectator.component.isFormValidObj.subscribe((value) => {
          expect(value).toBe('VALID');
          done();
        });

        spectator.component.onSubmit();
      })();
    });

    it('invalid required field - should not create', async () => {
      spectator.component.formMode = 'create';
      clipListService.checkDuplicateName.and.returnValue(of({isDuplicate: true}));
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Technology"]'},
        spectator.component.technologyOptions[0].value,
      );

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'name 1',
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        spectator.component.deepTeamOptions[0],
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Type"]'},
        spectator.component.typeOptions[0].value,
      );

      const nameError = getElementBySelector(spectator.fixture, 'mat-error');

      expect(nameError.nativeElement.innerText).toBe(' name 1 - already exists.');
    });

    it('duplicate - should add word new to name', async () => {
      clipListService.checkDuplicateName.and.returnValue(of({isDuplicate: true}));
      spectator.component.formMode = 'create';
      spyOn(spectator.component.fromValueChanged, 'emit');
      const fakeClipList = getFakeClipList(true);
      spectator.component.clipList = fakeClipList;
      spectator.detectChanges();

      expect(spectator.component.clipListForm.controls.name.value).toBe(
        `${fakeClipList.name}${DUPLICATE_SUFFIX_STR}`,
      );
    });
  });

  describe('edit existing', () => {
    it('should edit', async () => {
      spectator.component.formMode = 'edit';
      spectator.component.createButtonLabel = 'Edit Clip List';
      spyOn(spectator.component.fromValueChanged, 'emit');
      clipListService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
      spectator.component.clipList = getFakeClipList(true);
      spectator.detectChanges();

      // insert name
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'name 1',
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Edit Clip List'});

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        name: 'name 1',
      });
    });
  });

  describe('Tour', () => {
    it('create mode - should restore init form state', (done) => {
      spectator.component.tourService.createTours(
        [clipListFormTour],
        spectator.component.viewContainerRef,
      );
      spectator.component.clipList = undefined;
      spectator.component.formMode = 'create';
      spectator.component.createButtonLabel = 'Create Clip List';
      (async function () {
        spectator.detectChanges();

        // click submit
        await spectator.component.startTour();

        spectator.component.tourService.getOnNextStepClickObs().subscribe((enabled) => {
          if (enabled) {
            spectator.component.tourService.onNextStepClick();
          }
        });

        spectator.component.tourService.getOnTourOpenedObs().subscribe(async () => {
          //check reset fields
          expect(spectator.component.clipListForm.controls.technology.value).toEqual(
            spectator.component.technologyOptions[0].id,
          );

          expect(spectator.component.clipListForm.controls.camera.value).toEqual('');
          expect(spectator.component.clipListForm.controls.type.value).toEqual(
            spectator.component.typeOptions[0].id,
          );

          expect(spectator.component.clipListForm.controls.clipListFile.value).toEqual(null);
          expect(spectator.component.clipListForm.controls.tags.value).toEqual(null);
          expect(spectator.component.clipListForm.controls.brain.value).toEqual('');
          expect(spectator.component.clipListForm.controls.name.value).toEqual('');
          expect(spectator.component.clipListForm.controls.camera.value).toEqual('');
          expect(spectator.component.clipListForm.controls.description.value).toEqual('');
        });

        spectator.component.tourService.getOnTourCompletedObj().subscribe(async () => {
          //restore fields on complete
          expect(spectator.component.clipListForm.controls.technology.value).toEqual('');
          expect(spectator.component.clipListForm.controls.camera.value).toEqual('');
          expect(spectator.component.clipListForm.controls.type.value).toEqual(undefined);
          expect(spectator.component.clipListForm.controls.clipListFile.value).toEqual(null);
          expect(spectator.component.clipListForm.controls.tags.value).toEqual([]);
          expect(spectator.component.clipListForm.controls.brain.value).toEqual('');
          expect(spectator.component.clipListForm.controls.name.value).toEqual('');
          expect(spectator.component.clipListForm.controls.camera.value).toEqual('');
          expect(spectator.component.clipListForm.controls.description.value).toEqual('');

          done();
        });
      })();
    });

    it('edit mode - should restore all controls state on complete', (done) => {
      const fakeClipList = getFakeClipList(true);
      spectator.component.clipList = fakeClipList;
      spectator.component.tourService.createTours(
        [clipListFormTour],
        spectator.component.viewContainerRef,
      );
      spectator.component.formMode = 'edit';
      spectator.component.createButtonLabel = 'Update Clip List';
      (async function () {
        spectator.detectChanges();

        // click submit
        await spectator.component.startTour();

        spectator.component.tourService.getOnNextStepClickObs().subscribe((enabled) => {
          if (enabled) {
            spectator.component.tourService.onNextStepClick();
          }
        });

        spectator.component.tourService.getOnTourOpenedObs().subscribe(() => {
          //check reset fields
          expect(spectator.component.clipListForm.controls.technology.value).toEqual(
            spectator.component.technologyOptions[0].id,
          );

          expect(spectator.component.clipListForm.controls.camera.value).toEqual('');
          expect(spectator.component.clipListForm.controls.type.value).toEqual(
            spectator.component.typeOptions[0].id,
          );

          expect(spectator.component.clipListForm.controls.clipListFile.value).toEqual(null);
          expect(spectator.component.clipListForm.controls.tags.value).toEqual(null);
          expect(spectator.component.clipListForm.controls.brain.value).toEqual('');
          expect(spectator.component.clipListForm.controls.name.value).toEqual('');
          expect(spectator.component.clipListForm.controls.camera.value).toEqual('');
          expect(spectator.component.clipListForm.controls.description.value).toEqual('');
        });

        spectator.component.tourService.getOnTourCompletedObj().subscribe(async () => {
          //restore fields on complete
          expect(spectator.component.clipListForm.controls.technology.value).toEqual('AV');
          expect(spectator.component.clipListForm.controls.camera.value).toEqual(
            fakeClipList.camera,
          );

          expect(spectator.component.clipListForm.controls.type.value).toEqual(fakeClipList.type);
          expect(spectator.component.clipListForm.controls.clipListFile.value).toEqual(true);
          expect(spectator.component.clipListForm.controls.tags.value).toEqual(fakeClipList.tags);
          expect(spectator.component.clipListForm.controls.brain.value).toEqual(fakeClipList.brain);
          expect(spectator.component.clipListForm.controls.name.value).toEqual(fakeClipList.name);
          expect(spectator.component.clipListForm.controls.camera.value).toEqual(
            fakeClipList.camera,
          );

          expect(spectator.component.clipListForm.controls.description.value).toEqual(
            fakeClipList.description,
          );
          done();
        });
      })();
    });
  });
});
