import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {
  MeUploadFileComponent,
  MeUploadFileComponentMock,
} from '@mobileye/material/src/lib/components/upload-file';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {
  getElementBySelector,
  getElementsBySelector,
  MeButtonHarness,
  MeChipHarness,
  MeInputHarness,
  MeSelectHarness,
} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {AssetManagerService, OnPremService, PerfectListService} from 'deep-ui/shared/core';
import {PerfectListTypeEnum} from 'deep-ui/shared/models';
import {getFakePerfectList} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {PerfectListFormComponent} from './perfect-list-form.component';

describe('PerfectListFormComponent - Integration', () => {
  let spectator: Spectator<PerfectListFormComponent>;
  let assetManagerService: SpyObject<AssetManagerService>;
  let perfectListService: SpyObject<PerfectListService>;
  let onPremService: SpyObject<OnPremService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: PerfectListFormComponent,
    mocks: [AssetManagerService, PerfectListService, OnPremService],
    imports: [
      FormsModule,
      ReactiveFormsModule,
      MeInputComponent,
      MeTextareaComponent,
      MatButtonModule,
      MeTooltipDirective,
      MeSelectComponent,
      MeFormControlChipsFieldComponent,
      MeControlListComponent,
      MeUploadFileComponent,
    ],
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
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    assetManagerService = spectator.inject(AssetManagerService);
    perfectListService = spectator.inject(PerfectListService);
    onPremService = spectator.inject(OnPremService);
    assetManagerService.getTechnologiesOptions.and.returnValue(of([{id: 'AV', value: 'AV'}]));
    onPremService.queryFileSystem.and.returnValue(
      of({
        paths: [
          {
            absolutePath: '/mobileye/Perfects/PerfectResults/',
            type: 'folder',
            found: true,
          },
        ],
      }),
    );
    spectator.component.cancelButtonLabel = 'Back';
  });

  it('should create', () => {
    spectator.fixture.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('create new', () => {
    beforeEach(() => {
      spectator.component.createButtonLabel = 'Create Perfect List';
      spectator.component.formMode = 'create';
    });

    it('type - directory, valid - should create', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      perfectListService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
      spectator.detectChanges();
      await spectator.fixture.whenStable();

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
        {ancestor: '[title="Raw Data Owner"]'},
        spectator.component.rawDataOwnerOptions[0],
      );

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
        {ancestor: '[title="Perfects Folder"]'},
        '/mobileye/Perfects/PerfectResults/',
      );

      await MeChipHarness.addTag(
        spectator.fixture,
        loader,
        {ancestor: '[title="Tags (Optional)"]'},
        'new-tag',
      );

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Description (Optional)"]'},
        `some desc text`,
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create Perfect List'});
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        name: 'name 1',
        locationsOnMobileye: ['/mobileye/Perfects/PerfectResults/'],
        team: 'deep-fpa-objects',
        technology: 'AV',
        tags: ['new-tag'],
        description: 'some desc text',
        rawDataOwner: 'ALGO',
        file: null,
        perfectSearchUrl: '',
        type: PerfectListTypeEnum.DIRECTORY,
      });
    });

    it('type - file, valid - should create', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      perfectListService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
      spectator.detectChanges();
      await spectator.fixture.whenStable();

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
        {ancestor: '[title="Upload By"]'},
        spectator.component.typeOptions[1].value,
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Raw Data Owner"]'},
        spectator.component.rawDataOwnerOptions[0],
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Technology"]'},
        spectator.component.technologyOptions[0].value,
      );

      spectator.component.mainForm.controls.file.setValue('some-file');

      await MeChipHarness.addTag(
        spectator.fixture,
        loader,
        {ancestor: '[title="Tags (Optional)"]'},
        'new-tag',
      );

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Description (Optional)"]'},
        `some desc text`,
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create Perfect List'});
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        name: 'name 1',
        file: 'some-file',
        team: 'deep-fpa-objects',
        technology: 'AV',
        tags: ['new-tag'],
        description: 'some desc text',
        rawDataOwner: 'ALGO',
        locationsOnMobileye: [],
        perfectSearchUrl: '',
        type: PerfectListTypeEnum.FILE,
      });
    });

    it('type - perfectSearch, valid - should create', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      perfectListService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
      spectator.detectChanges();
      await spectator.fixture.whenStable();

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
        {ancestor: '[title="Upload By"]'},
        spectator.component.typeOptions[2].value,
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Raw Data Owner"]'},
        spectator.component.rawDataOwnerOptions[0],
      );

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
        {ancestor: '[title="PerfectSearch URL"]'},
        'https://pac.perfcloud.perfects.mobileye.com/',
      );

      await MeChipHarness.addTag(
        spectator.fixture,
        loader,
        {ancestor: '[title="Tags (Optional)"]'},
        'new-tag',
      );

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Description (Optional)"]'},
        `some desc text`,
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create Perfect List'});
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        name: 'name 1',
        file: null,
        team: 'deep-fpa-objects',
        technology: 'AV',
        tags: ['new-tag'],
        description: 'some desc text',
        rawDataOwner: 'ALGO',
        locationsOnMobileye: [],
        perfectSearchUrl: 'https://pac.perfcloud.perfects.mobileye.com/',
        type: PerfectListTypeEnum.PerfectSearch,
      });
    });

    it('form invalid', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      await MeButtonHarness.click(spectator.fixture, loader, {
        text: 'Create Perfect List',
      });

      await spectator.fixture.whenStable();

      const errors = getElementsBySelector(spectator.fixture, 'mat-error');

      expect(errors.length).toBe(5);
    });

    it('duplicate - should add word new to name', async () => {
      perfectListService.checkDuplicateName.and.returnValue(of({isDuplicate: true}));
      spyOn(spectator.component.fromValueChanged, 'emit');
      const entity = getFakePerfectList(true);
      spectator.component.entity = entity;
      spectator.detectChanges();

      expect(spectator.component.mainForm.controls.name.value).toBe(
        `${entity.name}${DUPLICATE_SUFFIX_STR}`,
      );
    });
  });

  describe('edit existing', () => {
    beforeEach(() => {
      spectator.component.createButtonLabel = 'Edit Perfect List';
      spectator.component.formMode = 'edit';
    });

    it('valid edit', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      perfectListService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
      spectator.component.entity = getFakePerfectList(true);
      spectator.detectChanges();

      // insert name
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'new name',
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Edit Perfect List'});

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        name: 'new name',
      });
    });

    it('invalid name', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      perfectListService.checkDuplicateName.and.returnValue(of({isDuplicate: true}));
      spectator.component.entity = getFakePerfectList(true);
      spectator.detectChanges();

      // insert name
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'new name',
      );

      const nameError = getElementBySelector(spectator.fixture, 'mat-error');

      expect(nameError.nativeElement.innerText).toBe(' new name - already exists.');
      expect(spectator.component.fromValueChanged.emit).not.toHaveBeenCalled();
    });

    it('add perfect folder', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      perfectListService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
      spectator.component.entity = getFakePerfectList(true);
      spectator.detectChanges();

      // add new perfect list row
      const addButton = getElementBySelector(spectator.fixture, '.add-button');
      addButton.nativeElement.click();
      spectator.detectChanges();

      // insert name
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.perfects-folder-list me-input:last-child', placeholder: 'Insert folder path'},
        '/mobileye/Perfects/PerfectResults/temp/',
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Edit Perfect List'});

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        locationsOnMobileye: ['/mobileye/Perfects/PerfectResults/temp/'],
      });
    });
  });
});
