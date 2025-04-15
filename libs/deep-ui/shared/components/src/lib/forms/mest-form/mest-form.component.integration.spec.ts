import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatInputModule} from '@angular/material/input';
import {MeDragDropListComponent} from '@mobileye/material/src/lib/components/form/drag-drop-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {
  MeParametersListComponent,
  MeParametersListItem,
  MeParametersListItemType,
} from '@mobileye/material/src/lib/components/form/parameters-list';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeTourStepComponent} from '@mobileye/material/src/lib/components/tour-step';
import {MeTourService} from '@mobileye/material/src/lib/services/tour';
import {
  getElementBySelector,
  MeButtonHarness,
  MeInputHarness,
} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {of} from 'rxjs';

import {MestFormComponent} from './mest-form.component';
import SpyObj = jasmine.SpyObj;
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {mestFormTour} from 'deep-ui/shared/configs';
import {
  DeepUtilService,
  DEFAULT_RETRY_ATTEMPTS,
  OnPremService,
  QueryFileSystem,
} from 'deep-ui/shared/core';
import {getFakeMEST} from 'deep-ui/shared/testing';

describe('MestFormComponent - Integration', () => {
  let spectator: Spectator<MestFormComponent>;
  let loader: HarnessLoader;
  let onPremService: SpyObj<OnPremService>;
  let deepUtilService: SpyObject<DeepUtilService>;

  const createComponent = createComponentFactory({
    component: MestFormComponent,
    imports: [
      MeDragDropListComponent,
      MeParametersListComponent,
      MatInputModule,
      MatIconModule,
      MatIconTestingModule,
      MatButtonModule,
      MeInputComponent,
      MeSelectComponent,
      MeTextareaComponent,
      MeTooltipDirective,
      MeTourStepComponent,
      ReactiveFormsModule,
    ],
    providers: [MeTourService],
    mocks: [OnPremService, DeepUtilService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('Create', () => {
    beforeEach(() => {
      spectator.component.formMode = 'create';
    });

    it('should fill mandatory fields and create', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      // set nickname
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: `.nickname-control`},
        'some_mest_name',
      );

      spectator.component.mestForm.controls.group.setValue('deep-fpa-objects');

      const items: MeParametersListItem[] = [
        {
          key: 'some-key',
          value: 'some-value',
          type: MeParametersListItemType.KEY_VALUE,
        },
      ];

      // update form
      spectator.component.mestForm.patchValue({
        executables: ['path/some-file.txt', '', ''],
        libs: ['path/some-file.txt', '', ''],
        params: items,
      });

      // set executables value
      const execInput = getElementBySelector(
        spectator.fixture,
        'me-drag-drop-list[formcontrolname="executables"]',
      );
      execInput.componentInstance.writeValue(['path/some-file.txt', '', '']);

      // //click params param
      const paramListAddButton = getElementBySelector(
        spectator.fixture,
        'me-parameters-list[formcontrolname="params"]',
      );
      paramListAddButton.componentInstance.writeValue(items);

      spectator.detectChanges();

      // click submit
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create MEST CMD'});

      const expectedData: any = {
        mest: {
          nickname: 'some_mest_name',
          executables: ['path/some-file.txt'],
          libs: ['path/some-file.txt'],
          brainLibs: [],
          args: '',
          params: [{key: 'some-key', value: 'some-value'}],
          id: undefined,
          rootPath: '',
          group: 'deep-fpa-objects',
        },
      };

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith(expectedData);
    });

    it('should show error on mandatory fields', async () => {
      spectator.detectChanges();

      // click submit
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create MEST CMD'});

      // check invalid executables
      let elem = getElementBySelector(
        spectator.fixture,
        `me-drag-drop-list[formcontrolname="executables"] .drag-drop-list-item--invalid`,
      );

      expect(elem).toBeDefined();

      // check invalid params
      elem = getElementBySelector(spectator.fixture, '.parameters-list-container--invalid');

      expect(elem).toBeDefined();

      // check nickname
      elem = getElementBySelector(spectator.fixture, '.nickname-control.ng-invalid .zz');

      expect(elem).toBeDefined();

      expect(spectator.component.mestForm.valid).toBeFalse();
    });
  });

  describe('Edit', () => {
    beforeEach(() => {
      spectator.component.formMode = 'edit';
      spectator.component.createButtonLabel = 'Update MEST CMD';
      deepUtilService = spectator.inject(DeepUtilService);
      deepUtilService.isIncludedInDeepGroupsOrIsAdmin.and.returnValue(true);
    });

    it('should add some fields and submit', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();
      const items: MeParametersListItem[] = [
        {
          key: 'some-key',
          value: 'some-value',
          type: MeParametersListItemType.KEY_VALUE,
        },
      ];
      spectator.component.mestForm.patchValue({
        executables: ['path/some-file.txt', '', ''],
        params: items,
        nickname: 'some_mest_name',
      });
      spectator.detectChanges();

      spectator.component.mestForm.patchValue({
        brainLibs: ['path/brainLibs1', 'path/brainLibs', 'path/brainLibs'],
        libs: ['path/lib1.txt', 'path/lib2.txt', 'path/lib3.txt'],
        args: 'some args',
        group: 'deep-fpa-objects',
      });

      // make a dirty change
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.nickname-control'},
        'some_mest_name_1',
      );

      // click submit
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Update MEST CMD'});

      const expectedData: any = {
        mest: {
          nickname: 'some_mest_name_1',
          group: 'deep-fpa-objects',
          executables: ['path/some-file.txt'],
          brainLibs: ['path/brainLibs1', 'path/brainLibs', 'path/brainLibs'],
          libs: ['path/lib1.txt', 'path/lib2.txt', 'path/lib3.txt'],
          args: 'some args',
          params: [{key: 'some-key', value: 'some-value'}],
          id: undefined,
          rootPath: '',
        },
      };

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith(expectedData);
    });

    it('should emit null, no dirty field', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      const items: MeParametersListItem[] = [
        {
          key: 'some-key',
          value: 'some-value',
          type: MeParametersListItemType.KEY_VALUE,
        },
      ];
      spectator.component.mest = {
        group: 'deep-fpa-objects',
        nickname: 'some_mest_name',
        params: items,
        executables: ['path/some-file.txt', '', ''],
        libs: ['path/some-file.txt', '', ''],
      } as any;

      spectator.detectChanges();
      spectator.fixture.whenStable();
      // click submit
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Update MEST CMD'});

      const expectedData: any = {mest: null};

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith(expectedData);
    });
  });

  describe('Override', () => {
    beforeEach(() => {
      spectator.component.formMode = 'override';
      const fakeResponse: QueryFileSystem = {
        retries: DEFAULT_RETRY_ATTEMPTS,
        paths: [
          {
            absolutePath: '/some/root-path/path/some-file.txt',
            type: 'file',
            found: true,
          },
          {
            absolutePath: '/some/root-path/path/lib1.txt',
            type: 'file',
            found: true,
          },
          {
            absolutePath: '/some/root-path/path/brainLibs1',
            type: 'folder',
            found: true,
          },
        ],
      };
      onPremService = spectator.inject(OnPremService);
      onPremService.queryPaths.and.returnValue(of(fakeResponse));
      onPremService.queryFileSystem.and.returnValue(of(fakeResponse));
      onPremService.queryPathsFileSystem.and.returnValue(of(fakeResponse));
    });

    it('should show root path and validate file fields', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      const items: MeParametersListItem[] = [
        {
          key: 'some-key-single',
          type: MeParametersListItemType.SINGLE,
        },
      ];
      spectator.component.mestForm.patchValue({
        executables: ['path/some-file.txt', '', ''],
        params: items,
        nickname: 'some_mest_name',
        brainLibs: ['path/brainLibs1', 'path/brainLibs2', 'path/brainLibs3'],
        libs: ['path/lib1.txt', 'path/lib2.txt', 'path/lib3.txt'],
        args: 'some args',
        group: 'deep-fpa-objects',
      });

      spectator.detectChanges();
      spectator.fixture.whenStable();
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.root-path-control'},
        '/some/root-path/',
      );

      spectator.detectChanges();
      spectator.fixture.whenStable();

      // make a dirty change
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.nickname-control'},
        'some_mest_name_1',
      );
      spectator.detectChanges();
      // no submit button, in override mode - button is not render in this component,it's render as a wizard next button
      spectator.component.onSubmit();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const expectedData: any = {
        mest: {
          nickname: 'some_mest_name_1',
          executables: ['path/some-file.txt'],
          brainLibs: ['path/brainLibs1', 'path/brainLibs2', 'path/brainLibs3'],
          libs: ['path/lib1.txt', 'path/lib2.txt', 'path/lib3.txt'],
          args: 'some args',
          params: [{key: 'some-key-single'}],
          id: undefined,
          rootPath: '/some/root-path/',
          group: 'deep-fpa-objects',
        },
      };

      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith(expectedData);
    });
  });

  describe('Tour', () => {
    it('create mode - should restore init form state', (done) => {
      spectator.component.tourService.createTours(
        [mestFormTour],
        spectator.component.viewContainerRef,
      );
      spectator.component.formMode = 'create';
      spectator.component.createButtonLabel = 'Create MEST CMD';
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
          expect(spectator.component.mestForm.controls.nickname.value).toEqual('');
          expect(spectator.component.mestForm.controls.executables.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.libs.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.brainLibs.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.args.value).toEqual('');
          expect(spectator.component.mestForm.controls.params.value).toEqual([]);
        });

        spectator.component.tourService.getOnTourCompletedObj().subscribe(async () => {
          //restore fields on complete
          expect(spectator.component.mestForm.controls.executables.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.libs.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.brainLibs.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.args.value).toEqual('');
          expect(spectator.component.mestForm.controls.params.value).toEqual([]);
          done();
        });
      })();
    });

    it('edit mode - should restore all controls state on complete', (done) => {
      const fakeMest = getFakeMEST(true);
      const item: MeParametersListItem = {
        key: 'param1',
        value: 'value1',
        type: MeParametersListItemType.KEY_VALUE,
      };
      spectator.component.mest = fakeMest;
      spectator.component.tourService.createTours(
        [mestFormTour],
        spectator.component.viewContainerRef,
      );
      spectator.component.formMode = 'edit';
      spectator.component.createButtonLabel = 'Update MEST CMD';
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
          expect(spectator.component.mestForm.controls.nickname.value).toEqual('');
          expect(spectator.component.mestForm.controls.executables.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.libs.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.brainLibs.value).toEqual(['', '', '']);
          expect(spectator.component.mestForm.controls.args.value).toEqual('');
          expect(spectator.component.mestForm.controls.params.value).toEqual([]);
        });

        spectator.component.tourService.getOnTourCompletedObj().subscribe(async () => {
          //restore fields on complete
          expect(spectator.component.mestForm.controls.nickname.value).toEqual(fakeMest.nickname);
          expect(spectator.component.mestForm.controls.executables.value).toEqual([
            'executable1',
            'executable2',
            '',
          ]);

          expect(spectator.component.mestForm.controls.libs.value).toEqual(['lib1', 'lib2', '']);
          expect(spectator.component.mestForm.controls.brainLibs.value).toEqual([
            'brainLib1',
            'brainLib2',
            '',
          ]);

          expect(spectator.component.mestForm.controls.args.value).toEqual('some arg');
          expect(spectator.component.mestForm.controls.params.value).toEqual([item]);
          done();
        });
      })();
    });
  });
});
