import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogModule} from '@angular/material/dialog';
import {MatError} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {MatRadioGroupHarness} from '@angular/material/radio/testing';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeUploadFileBtnComponent} from '@mobileye/material/src/lib/components/upload-file-btn';
import {
  MeButtonHarness,
  MeChipHarness,
  MeInputHarness,
  MeSelectHarness,
} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasourceService} from 'deep-ui/shared/core';
import {getFakeGoldenLabelsDataSource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {CreateGoldenLabelsDataSourceDialogComponent} from './create-golden-labels-data-source-dialog.component';

describe('CreateGoldenLabelsDataSourceDialog', () => {
  let spectator: Spectator<CreateGoldenLabelsDataSourceDialogComponent>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;
  let datasourceService: SpyObject<DatasourceService>;

  const createComponent = createComponentFactory({
    component: CreateGoldenLabelsDataSourceDialogComponent,
    imports: [
      ReactiveFormsModule,
      MeInputComponent,
      MeSelectComponent,
      MeFormControlChipsFieldComponent,
      MeTextareaComponent,
      MatError,
      MeJsonEditorComponent,
      MeUploadFileBtnComponent,
      MatIcon,
      MatRadioButton,
      MatRadioGroup,
      MeAutocompleteComponent,
      MeControlListComponent,
      MatButton,
      MatDialogClose,
      MatDialogModule,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          flow: 'create',
        },
      },
    ],
    mocks: [DatasourceService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    datasourceService = spectator.inject(DatasourceService);

    datasourceService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    datasourceService.validateGoldenLabelsDatasourceSchema.and.returnValue(of(null));
    datasourceService.validateGoldenLabelsDatasourceS3Path.and.returnValue(of(null));
    datasourceService.createGoldenLabelsDatasource.and.returnValue(of(null));
    datasourceService.updateGoldenLabelsDatasourceSchema.and.returnValue(of(null));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('Create data source form existing DB', () => {
    it('should create', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.submitted.subscribe(() => {
        expect(spectator.component.form.controls.schema.disabled).toBeTruthy();
      });

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'name1',
      );
      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        'deep-fpa-objects',
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Data level"]'},
        'Clips',
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

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="S3 data path"]'},
        's3://some-path/',
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create'});

      await spectator.fixture.whenStable();
    });

    it('should should show s3 path error', async () => {
      datasourceService.validateGoldenLabelsDatasourceS3Path.and.returnValue(
        of({
          error: 'some error',
        }),
      );

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'name1',
      );
      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        'deep-fpa-objects',
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Data level"]'},
        'Events',
      );

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="S3 data path"]'},
        's3://some-path/',
      );

      await spectator.fixture.whenStable();

      expect(spectator.component.errorFeedbackMsg()).toBe('S3 data path error: some error');
    });
  });

  describe('Create blank data source', () => {
    it('should create', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.submitted.subscribe(() => {
        expect(spectator.component.form.controls.s3Path.disabled).toBeTruthy();
      });

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'name1',
      );
      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        'deep-fpa-objects',
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Data level"]'},
        'Frames',
      );

      const flowOptions = await loader.getHarness(MatRadioGroupHarness);
      await flowOptions.checkRadioButton({label: 'Create a blank data source'});

      spectator.component.form.controls.schema.setValue([{test: true}] as any);

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create'});
      await spectator.fixture.whenStable();
    });

    it('should should show schema error', async () => {
      datasourceService.validateGoldenLabelsDatasourceSchema.and.returnValue(
        of({
          error: {
            errors: ['some error - 1', 'some error - 2'],
          },
        }),
      );

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'name1',
      );
      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        'deep-fpa-objects',
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Data level"]'},
        'Events',
      );

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="S3 data path"]'},
        's3://some-path/',
      );

      const flowOptions = await loader.getHarness(MatRadioGroupHarness);
      await flowOptions.checkRadioButton({label: 'Create a blank data source'});

      spectator.component.form.controls.schema.setValue([{test: true}] as any);

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create'});
      await spectator.fixture.whenStable();

      expect(spectator.component.errorFeedbackMsg()).toContain(`some error - 1`);
      expect(spectator.component.errorFeedbackMsg()).toContain(`some error - 2`);
    });
  });

  describe('Update schema', () => {
    it('should update', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.component.flow = 'updateSchema';
      spectator.component.selectedDatasource = getFakeGoldenLabelsDataSource(true);
      spectator.component.schema = [{test: false} as any];
      // trigger because we can't change the MAT_DIALOG_DATA after the component is created
      const key = '_setFormValidation';
      spectator.component[key]();
      spectator.detectChanges();

      await spectator.fixture.whenStable();

      spectator.component.submitted.subscribe(() => {
        expect(spectator.component).toBeTruthy();
      });

      spectator.component.form.controls.schema.setValue([{test: true}] as any);
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Update'});
      await spectator.fixture.whenStable();
    });
  });
});
