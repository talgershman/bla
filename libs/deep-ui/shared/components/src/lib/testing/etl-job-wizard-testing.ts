import {LoadSuccessParams} from '@ag-grid-community/core';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ComponentFixture} from '@angular/core/testing';
import {MatCheckboxHarness} from '@angular/material/checkbox/testing';
import {MatInputHarness} from '@angular/material/input/testing';
import {MatRadioGroupHarness} from '@angular/material/radio/testing';
import {MatSlideToggleHarness} from '@angular/material/slide-toggle/testing';
import {
  DropFileEventMock,
  MeAgTableHarness,
  MeButtonHarness,
  MeChipHarness,
  MeExpansionPanelHarness,
  MeInputHarness,
  MeInputListHarness,
  MeSelectHarness,
  MeToggleHarness,
  waitForDeferredBlocks,
} from '@mobileye/material/src/lib/testing';
import {addDaysToDate, dateNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {SpyObject} from '@ngneat/spectator';
import {endOfToday} from 'date-fns';
import {ClipToLogLogsFilterStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-to-log-logs-filter-step';
import {LogFileStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/log-file-step';
import {
  AgDatasourceService,
  AssetManagerService,
  ClipListService,
  EtlService,
  LaunchService,
  MestFoundPathsResponse,
  MestService,
  OnPremService,
  ParsingConfigurationService,
  SubmitJobAVPipeline,
  SubmitJobCloudMco,
  SubmitJobMetro,
  SubmitJobRequest,
} from 'deep-ui/shared/core';
import {
  ClipListTypeEnum,
  DataRetentionKnownKeysEnum,
  Datasource,
  ETL,
  EtlGroup,
  EtlJobFlowsEnum,
  EtlJobRunType,
  EtlServiceTypes,
  EtlTypeEnum,
  MEST,
  ParsingConfiguration,
  ParsingConfigurationGroupResponse,
  VersionDataSource,
} from 'deep-ui/shared/models';
import {
  getFakeClipList,
  getFakeETL,
  getFakeETLDataPrepOrGenericDataPrepOnly,
  getFakeMEST,
  getFakeParsingConfiguration,
} from 'deep-ui/shared/testing';
import _startCase from 'lodash-es/startCase';
import {NgxFileDropEntry} from 'ngx-file-drop';
import {of} from 'rxjs';

export const mergeDefaults = (defaults: any, overrides: any): any => {
  const result = {};
  Object.keys(defaults || {}).forEach((key) => {
    result[key] = key in overrides ? overrides[key] : defaults[key];
  });
  Object.keys(overrides || {}).forEach((key) => {
    if (overrides[key] === undefined) {
      result[key] = undefined;
    } else if (overrides[key]) {
      result[key] = overrides[key];
    } else if (overrides[key] === null) {
      delete result[key];
    }
  });
  return result;
};

export const goToNextStep = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  text = 'Next',
): Promise<any> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>(async (resolve, reject) => {
    const isDisabled = await MeButtonHarness.isDisabled(fixture, loader, {text});
    if (!isDisabled) {
      try {
        await MeButtonHarness.click(fixture, loader, {text});
        resolve();
        // eslint-disable-next-line
      } catch (e) {
        resolve();
        // could cause a express change after check error for mat focus , no biggie can ignore
      }
    } else {
      //retry one more time
      setTimeout(async () => {
        const isDisabled = await MeButtonHarness.isDisabled(fixture, loader, {text});
        if (isDisabled) {
          reject();
          return;
        } else {
          try {
            await MeButtonHarness.click(fixture, loader, {text});
            resolve();
            // eslint-disable-next-line
          } catch (e) {
            resolve();
            // could cause a express change after check error for mat focus , no biggie can ignore
          }
        }
      }, 200);
    }
  });
};

export const VJwizardSetup = (
  fixture: ComponentFixture<any>,
  component: any,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  mestService: SpyObject<MestService>,
  clipListService: SpyObject<ClipListService>,
  parsingConfigurationService: SpyObject<ParsingConfigurationService>,
  etlService: SpyObject<EtlService>,
  onPremService: SpyObject<OnPremService>,
  launchService: SpyObject<LaunchService>,
  assetManagerService: SpyObject<AssetManagerService>,
  etlType: EtlTypeEnum = EtlTypeEnum.VALIDATION,
): any => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000; // 50 secs
  // eslint-disable-next-line
  loader = TestbedHarnessEnvironment.loader(fixture);
  // eslint-disable-next-line
  docLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  // eslint-disable-next-line
  const mestsArr = [
    getFakeMEST(true, {createdAt: '2021-03-02T13:27:39.284574+00:00'}),
    getFakeMEST(true, {createdAt: '2021-03-01T13:27:39.284574+00:00'}),
  ];

  component.dataRetentionInfoObj = {
    [DataRetentionKnownKeysEnum.PARSED_DATA]: {
      max: 30,
      default: 10,
      tooltip: 'some tooltip',
      label: 'Parsed Data',
    },
  };

  const etlsArr =
    etlType === EtlTypeEnum.MODEL_INFERENCE
      ? [
          getFakeETL(true, {}, EtlTypeEnum.MODEL_INFERENCE),
          getFakeETL(true, {}, EtlTypeEnum.MODEL_INFERENCE),
          getFakeETLDataPrepOrGenericDataPrepOnly(
            true,
            {type: EtlTypeEnum.MODEL_INFERENCE},
            EtlServiceTypes.GenericDataPrep,
          ),
        ]
      : [getFakeETL(true), getFakeETL(true), getFakeETLDataPrepOrGenericDataPrepOnly(true)];
  const clipListsArr = [
    getFakeClipList(true),
    getFakeClipList(true),
    getFakeClipList(true, {numberOfClips: 999}),
    getFakeClipList(true, {numberOfClips: 10}),
    getFakeClipList(true, {type: ClipListTypeEnum.GENERIC}),
  ];
  const parsingArr = [
    getFakeParsingConfiguration(true),
    getFakeParsingConfiguration(true),
    getFakeParsingConfiguration(true),
  ];
  if (mestService) {
    const mestFoundPathsResponse: MestFoundPathsResponse = {
      executable: {
        foundPath: '/path/executable1',
        errorMsg: '',
      },
      lib: {
        foundPath: '/path/lib1',
        errorMsg: '',
      },
      brainLib: {
        foundPath: '/path/brainLib1',
        errorMsg: '',
      },
    };
    mestService.getAgGridMulti.and.returnValue(
      of({
        rowData: mestsArr,
        rowCount: mestsArr.length,
      }),
    );
    mestService.getMestSelectedPaths.and.returnValue(of(mestFoundPathsResponse));
  }
  if (clipListService) {
    clipListService.getMulti.and.returnValue(of(clipListsArr));
  }
  if (parsingConfigurationService) {
    parsingConfigurationService.getLeanMulti.and.returnValue(of(parsingArr));
  }
  if (etlService) {
    etlService.getMulti.and.returnValue(of(etlsArr));
    etlService.getService.and.returnValue(of(null));
  }
  if (onPremService) {
    onPremService.queryFileSystem.and.returnValue(
      of({
        paths: [
          {
            absolutePath: 'folder1',
            type: 'folder',
            found: true,
          },
        ],
      }),
    );
    onPremService.queryPaths
      .withArgs([
        {
          type: 'folder',
          absolutePath: 'folder1',
        },
      ])
      .and.returnValue(
        of({
          paths: [
            {
              absolutePath: 'folder1',
              type: 'folder',
              found: true,
            },
          ],
          retries: 3,
        }),
      );
    onPremService.queryPaths
      .withArgs([
        {
          type: 'file',
          absolutePath: 'file1',
        },
      ])
      .and.returnValue(
        of({
          paths: [
            {
              absolutePath: 'file1',
              type: 'file',
              found: true,
            },
          ],
          retries: 3,
        }),
      );

    onPremService.queryFileSystem.withArgs('folder1', 'path').and.returnValue(
      of({
        paths: [
          {
            absolutePath: 'folder1',
            type: 'folder',
            found: true,
          },
        ],
      }),
    );
    onPremService.queryFileSystem.withArgs('file1', 'path').and.returnValue(
      of({
        paths: [
          {
            absolutePath: 'file1',
            type: 'file',
            found: true,
          },
        ],
      }),
    );
  }
  if (launchService) {
    launchService.uploadPCRunLogFile.and.returnValue(
      of({
        s3Path: 'some-key',
        clipsToParamsHashPath: 'some-hash',
      }),
    );
    launchService.submitJob.and.returnValue(
      of({
        isCreated: true,
        jobUuid: 'job-id-123',
      }),
    );
  }
  if (assetManagerService) {
    assetManagerService.getTechnologiesOptions.and.returnValue(
      of([
        {id: 'AV', value: 'AV'},
        {id: 'TFL', value: 'TFL'},
        {id: 'REM', value: 'REM'},
      ]),
    );
  }
  return {
    mestsArr,
    etlsArr,
    clipListsArr,
    parsingArr,
    loader,
    docLoader,
  };
};

export const getDateInXDays = (daysToAdd = 10): string => {
  const date = endOfToday();
  const addedDate = addDaysToDate(date, daysToAdd);
  return toShortDate(addedDate);
};

export const getExpectedSubmitJobRequest = (
  etl: Partial<ETL>,
  mestValue: MEST,
  overrides: Partial<
    SubmitJobRequest | SubmitJobMetro | SubmitJobAVPipeline | SubmitJobCloudMco
  > = {},
): SubmitJobRequest => {
  let mest = null;

  if (mestValue) {
    mest = {
      id: mestValue.id,
      rootPath: '/some-root/',
      isOverride: false,
      params: null,
      nickname: mestValue.nickname,
      executable: `/path/${mestValue.executables[0]}`,
      lib: `/path/${mestValue.libs[0]}`,
      brainLib: `/path/${mestValue.brainLibs[0]}`,
      args: 'some arg',
      skipMestRetry: false,
    };
  }

  const defaults = {
    flowType: EtlJobFlowsEnum.VERSION_PERFECT,
    runType: EtlJobRunType.FULL_RUN,
    dataRetention: {
      [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
    },
    outputPath: 'output_path_1',
    tags: ['tag1', 'tag2'],
    team: 'deep-fpa-objects',
    mest,
    budgetGroup: 'deep',
    probe: {
      id: etl.id,
      params: {
        probeLogic: {
          id: 2,
          configuration: {
            other: true,
          },
        },
        dataPrep: {
          id: 1,
          configuration: {
            skip: true,
            upload_files: [
              {
                type: 'file',
                path: 'file1',
              },
              {
                type: 'folder',
                path: 'folder1',
              },
            ],
          },
        },
      },
    },
    parsingOnly: false,
    mergeParsedData: false,
    createDatasourceFromParsedData: false,
    forceParsing: false,
    dataset: {
      s3Path: 'some path',
      clipsToParamsHashPath: 'some-hash-path',
    },
  };

  if (overrides.flowType === EtlJobFlowsEnum.METRO) {
    defaults.probe.params = {
      logic: {
        id: 2,
        configuration: {
          other: true,
        },
      },
      genericDataPrep: {
        id: 1,
        configuration: {
          skip: true,
          upload_files: [
            {
              type: 'file',
              path: 'file1',
            },
            {
              type: 'folder',
              path: 'folder1',
            },
          ],
        },
      },
    } as any;
  }

  return mergeDefaults(defaults, overrides);
};

export const fillClipListStep = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  overrides: {
    selectedRow?: number;
    secondSelectedRow?: number;
    thirdSelectedRow?: number;
  } = {},
): Promise<any> => {
  const defaults = {selectedRow: 0, secondSelectedRow: null, thirdSelectedRow: null};
  const overridesWithDefaults = mergeDefaults(defaults, overrides);
  // select clip list
  await MeAgTableHarness.clickRow(fixture, overridesWithDefaults.selectedRow);
  if (overridesWithDefaults.secondSelectedRow !== null) {
    await MeAgTableHarness.clickRow(fixture, overridesWithDefaults.secondSelectedRow);
  }
  if (overridesWithDefaults.thirdSelectedRow !== null) {
    await MeAgTableHarness.clickRow(fixture, overridesWithDefaults.thirdSelectedRow);
  }

  fixture.detectChanges();
  await fixture.whenStable();
};

export const fillMestStep = async (
  fixture: ComponentFixture<any>,
  docLoader: HarnessLoader,
  loader: HarnessLoader,
  overrides: {
    rootPath?: string;
    selectedRow?: number;
    clipListName?: string;
    isMainVersion?: boolean;
    mestOutputsNickname?: string;
    mestSyncLocalDirectory?: string;
  } = {},
): Promise<any> => {
  const defaults = {
    rootPath: '/some-root/',
    selectedRow: 0,
    clipListName: '',
    isMainVersion: false,
    mestOutputsNickname: '',
  };
  const overridesWithDefaults = mergeDefaults(defaults, overrides);
  const ancestorRule = `.ag-center-cols-container [row-index="${overridesWithDefaults.selectedRow}"]`;
  await MeAgTableHarness.waitForTable(fixture);
  // set root path
  await MeInputHarness.setValue(
    fixture,
    loader,
    {
      ancestor: ancestorRule,
      placeholder: 'Root directory path here',
    },
    overridesWithDefaults.rootPath,
  );

  if (overridesWithDefaults.mestOutputsNickname) {
    await MeToggleHarness.check(loader, {
      label: 'Nickname',
    });

    await MeInputHarness.setValue(
      fixture,
      loader,
      {
        ancestor: ancestorRule,
        placeholder: 'Insert MEST nickname (Optional)',
      },
      overridesWithDefaults.mestOutputsNickname,
    );
  }

  if (overridesWithDefaults.mestSyncLocalDirectory) {
    await MeToggleHarness.check(loader, {
      label: 'Sync MEST results',
    });

    await MeInputHarness.setValue(
      fixture,
      loader,
      {
        ancestor: ancestorRule,
        placeholder: 'Insert output location (Optional)',
      },
      overridesWithDefaults.mestSyncLocalDirectory,
    );
  }

  if (overridesWithDefaults.isMainVersion) {
    const checkboxHarness = await loader.getHarness<MatCheckboxHarness>(
      MatCheckboxHarness.with({
        ancestor: `${ancestorRule} .is-main-container`,
      }),
    );
    await checkboxHarness.check();
  }
  if (overridesWithDefaults.clipListName) {
    await MeSelectHarness.selectOptionByText(
      fixture,
      loader,
      docLoader,
      {
        ancestor: ancestorRule,
      },
      overridesWithDefaults.clipListName,
    );
  }
  fixture.detectChanges();
  await fixture.whenStable();
};

export const fillDatasourcesStep = async (
  fixture: ComponentFixture<any>,
  docLoader: HarnessLoader,
  loader: HarnessLoader,
  overrides: {
    fpaPerfectsText?: string;
    dataSources?: Array<{ds: Datasource; version?: VersionDataSource}>;
    agDatasourceService?: SpyObject<AgDatasourceService>;
  } = {},
): Promise<any> => {
  const defaults = {
    fpaPerfectsText: '',
    dataSources: [],
    agDatasourceService: null,
  };

  const overridesWithDefaults = mergeDefaults(defaults, overrides);

  if (overridesWithDefaults?.fpaPerfectsText) {
    const flowOptions = await loader.getHarness(MatRadioGroupHarness);
    await flowOptions.checkRadioButton({label: 'FPA perfects'});
    await MeSelectHarness.selectOptionByText(
      fixture,
      loader,
      docLoader,
      {ancestor: 'de-datasources-step .fpa-perfects-control'},
      overridesWithDefaults.fpaPerfectsText,
    );
  }

  if (overridesWithDefaults?.dataSources.length) {
    await waitForDeferredBlocks(fixture);
    for (const dataSourceData of overridesWithDefaults.dataSources as Array<{
      ds: Datasource;
      version?: VersionDataSource;
    }>) {
      if (dataSourceData.version) {
        const callback = async () => {
          overridesWithDefaults.agDatasourceService?.getMulti.and.returnValue(
            of({
              rowData: dataSourceData.ds.datasourceversionSet,
              rowCount: dataSourceData.ds.datasourceversionSet?.length,
            } as LoadSuccessParams),
          );
          fixture.detectChanges();
          await fixture.whenStable();
          fixture.detectChanges();
        };
        const versionIndex = dataSourceData.ds.datasourceversionSet.findIndex(
          (version: VersionDataSource) => version.id === dataSourceData.version.id,
        );
        await MeAgTableHarness.clickGroupByValue(
          fixture,
          dataSourceData.ds.name,
          versionIndex,
          callback,
        );
      } else {
        overridesWithDefaults.agDatasourceService?.getMulti.and.returnValue(
          of({
            rowData: [], // This flow doesn't need to test the version level so we can pass an empty array
            rowCount: 0,
          } as LoadSuccessParams),
        );
        fixture.detectChanges();
        await MeAgTableHarness.clickRowByValue(
          fixture,
          overridesWithDefaults.dataSources[1].ds.name,
        );
      }
    }
  }

  await fixture.whenStable();
};

export const fillConfigurationStep = async (
  fixture: ComponentFixture<any>,
  docLoader: HarnessLoader,
  loader: HarnessLoader,
  overrides: {
    defaultTeam?: string;
    tags?: string[];
    firstUploadFileText?: string;
    newItemUploadFileText?: string;
    mergeParsedData?: boolean;
    createDatasourceFromParsedData?: boolean;
    forceParsing?: boolean;
    skipMestRetry?: boolean;
    outputPath?: string;
    dataRetentionCustom?: string;
  } = {},
): Promise<any> => {
  const defaults = {
    defaultTeam: 'deep-fpa-objects',
    tags: ['tag1', 'tag2'],
    dataSourceVersions: [],
    firstUploadFileText: 'file1',
    newItemUploadFileText: 'folder1',
    mergeParsedData: false,
    outputPath: '',
    forceParsing: false,
    skipMestRetry: false,
    dataRetentionCustom: '',
  };

  async function _clickGeneralPanel(): Promise<void> {
    await MeExpansionPanelHarness.expand(fixture, loader, {
      title: 'General',
    });
  }

  async function _clickServicesPanel(): Promise<void> {
    await MeExpansionPanelHarness.expand(fixture, loader, {
      title: 'ETL params',
    });
  }

  async function _clickDataRetentionPanel(): Promise<void> {
    await MeExpansionPanelHarness.expand(fixture, loader, {
      title: 'Data retention',
    });
  }

  const overridesWithDefaults = mergeDefaults(defaults, overrides);

  if (overridesWithDefaults?.defaultTeam) {
    await _clickGeneralPanel();
    await MeSelectHarness.selectOptionByText(
      fixture,
      loader,
      docLoader,
      {ancestor: '.controls .team-control'},
      overridesWithDefaults.defaultTeam,
    );
  }

  if (overridesWithDefaults?.tags?.length >= 1) {
    await _clickGeneralPanel();
    await MeChipHarness.addTag(
      fixture,
      loader,
      {ancestor: '.tags-control'},
      overridesWithDefaults.tags[0],
    );
  }
  if (overridesWithDefaults?.tags?.length >= 2) {
    await _clickGeneralPanel();
    // set tags
    await MeChipHarness.addTag(
      fixture,
      loader,
      {ancestor: '.tags-control'},
      overridesWithDefaults.tags[1],
    );
  }
  if (overridesWithDefaults?.outputPath) {
    await _clickGeneralPanel();
    await MeInputHarness.setValue(
      fixture,
      loader,
      {placeholder: 'Output path'},
      overridesWithDefaults.outputPath,
    );
  }

  if (
    overridesWithDefaults?.mergeParsedData ||
    overridesWithDefaults?.createDatasourceFromParsedData
  ) {
    const slider = await loader.getHarness<MatSlideToggleHarness>(
      MatSlideToggleHarness.with({
        ancestor: '.create-datasource-control',
      }),
    );
    await slider.check();
  }

  if (overridesWithDefaults?.forceParsing) {
    const slider = await loader.getHarness<MatSlideToggleHarness>(
      MatSlideToggleHarness.with({
        ancestor: '.force-parsing-control',
      }),
    );
    await slider.check();
  }

  if (overridesWithDefaults?.skipMestRetry) {
    const slider = await loader.getHarness<MatSlideToggleHarness>(
      MatSlideToggleHarness.with({
        ancestor: '.skip-mest-retry-control',
      }),
    );
    await slider.check();
  }

  if (overridesWithDefaults?.firstUploadFileText) {
    await _clickServicesPanel();
    // set upload files
    await MeInputListHarness.setValue(
      fixture,
      loader,
      {placeholder: 'Insert folder/file path'},
      overridesWithDefaults.firstUploadFileText,
    );
  }
  if (overridesWithDefaults?.newItemUploadFileText) {
    await _clickServicesPanel();
    // add new item
    await MeInputListHarness.addItem(
      fixture,
      loader,
      '.services-container',
      {placeholder: 'Insert folder/file path'},
      overridesWithDefaults.newItemUploadFileText,
    );
  }

  if (overridesWithDefaults?.dataRetentionCustom) {
    await _clickDataRetentionPanel();
    await MeInputHarness.setValue(
      fixture,
      loader,
      {ancestor: `[title='${_startCase(DataRetentionKnownKeysEnum.PARSED_DATA)}']`},
      overridesWithDefaults?.dataRetentionCustom,
    );
  }

  await fixture.whenStable();
};

export const getEtlsData = (
  etlsArr: Array<ETL>,
  overrideNames: Array<string> = ['AV', 'test', 'vd'],
): {groups: Array<EtlGroup>; etls: Array<Array<ETL>>} => {
  const groups = [];
  const etls = [];
  const date = dateNow();
  const names = overrideNames?.length
    ? overrideNames
    : Array.from(new Set(etlsArr.map((e: ETL) => e.name)));
  for (let i = 0; i < names.length; i++) {
    date.setSeconds(i);
    groups.push({
      name: names[i],
      childCount: names.length,
      modifiedAt: date.toISOString(),
    });
    etls.push([]);
    for (const etl of etlsArr) {
      if (!overrideNames?.length && etl.name !== names[i]) {
        continue;
      }
      etls[i].push({
        ...etl,
        id: parseInt(`${etl.id}${i + 1}`),
        name: overrideNames?.length ? overrideNames[i] : etl.name,
      });
    }
  }
  return {
    groups,
    etls,
  };
};

export const fillEtlStep = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  etlsData: {groups: Array<EtlGroup>; etls: Array<Array<ETL>>},
  overrides: {
    selectedRow?: number;
    selectNameIndex?: number;
    skipSelectName?: boolean;
    etlService?: SpyObject<EtlService>;
  } = {},
): Promise<any> => {
  await waitForDeferredBlocks(fixture);
  const defaults = {selectedRow: 0, selectNameIndex: 0, skipSelectName: false};
  const overridesWithDefaults = mergeDefaults(defaults, overrides);
  const {groups, etls} = etlsData;
  if (!overridesWithDefaults.skipSelectName) {
    const callback = async () => {
      overridesWithDefaults.etlService?.getAgGridMulti.and.returnValue(
        of({
          rowData: etls[overridesWithDefaults.selectNameIndex],
          rowCount: etls[overridesWithDefaults.selectNameIndex].length,
        } as LoadSuccessParams),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    await MeAgTableHarness.clickGroupByValue(
      fixture,
      groups[overridesWithDefaults.selectNameIndex].name,
      overridesWithDefaults.selectedRow,
      callback,
    );

    return;
  }
  await MeAgTableHarness.clickRow(fixture, overridesWithDefaults.selectedRow + 1);
};

export const getParsingData = (
  parsingsArr: Array<ParsingConfiguration>,
  overrideNames: Array<string> = ['AV', 'test', 'vd'],
): {
  groups: Array<ParsingConfigurationGroupResponse>;
  parsingConfigs: Array<Array<ParsingConfiguration>>;
} => {
  const groups = [];
  const parsingConfigs = [];
  const date = dateNow();
  const folders = overrideNames?.length
    ? overrideNames
    : Array.from(new Set(parsingsArr.map((p: ParsingConfiguration) => p.folder)));
  for (let i = 0; i < folders.length; i++) {
    date.setSeconds(i);
    groups.push({
      folder: folders[i],
      childCount: folders.length,
    });
    parsingConfigs.push([]);
    for (const parsingConfig of parsingsArr) {
      if (!overrideNames?.length && parsingConfig.folder !== folders[i]) {
        continue;
      }
      parsingConfigs[i].push({
        ...parsingConfig,
        id: parseInt(`${parsingConfig.id}${i + 1}`),
        name: overrideNames?.length ? overrideNames[i] : parsingConfig.name,
      });
    }
  }
  return {
    groups,
    parsingConfigs,
  };
};

export const fillParsingStep = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  parsingsData: {
    groups: Array<ParsingConfigurationGroupResponse>;
    parsingConfigs: Array<Array<ParsingConfiguration>>;
  },
  overrides: {
    selectedRow?: number;
    selectNameIndex?: number;
    skipSelectName?: boolean;
    parsingConfigurationService?: SpyObject<ParsingConfigurationService>;
    overlayContainerElement?: HTMLElement;
  } = {},
): Promise<any> => {
  const defaults = {
    selectedRow: 0,
    selectNameIndex: 0,
    skipSelectName: false,
    overlayContainerElement: null,
  };
  const overridesWithDefaults = mergeDefaults(defaults, overrides);
  const {groups, parsingConfigs} = parsingsData;

  if (!overridesWithDefaults.skipSelectName) {
    const callback = async () => {
      overridesWithDefaults.parsingConfigurationService?.getAgGridMulti.and.returnValue(
        of({
          rowData: parsingConfigs[overridesWithDefaults.selectNameIndex],
          rowCount: parsingConfigs[overridesWithDefaults.selectNameIndex].length,
        } as LoadSuccessParams),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    await MeAgTableHarness.clickGroupByValue(
      fixture,
      groups[overridesWithDefaults.selectNameIndex].folder,
      overridesWithDefaults.selectedRow,
      callback,
      overridesWithDefaults.overlayContainerElement,
    );

    return;
  }
  await MeAgTableHarness.clickRow(fixture, overridesWithDefaults.selectedRow + 1);
};

export const fillC2LFilterStep = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  overrides: {
    fileName?: string;
    file?: {s3Path: string};
    clipListId?: number;
  } = {},
  clipToLogFilterStep: ClipToLogLogsFilterStepComponent = null,
): Promise<any> => {
  const defaults = {};
  const overridesWithDefaults = mergeDefaults(defaults, overrides);
  if (!overridesWithDefaults.file && !overridesWithDefaults.clipListId) {
    const flowOptions = await loader.getHarness(MatRadioGroupHarness);
    await flowOptions.checkRadioButton({label: 'No Filter'});
  } else if (overridesWithDefaults.clipListId) {
    const flowOptions = await loader.getHarness(MatRadioGroupHarness);
    await flowOptions.checkRadioButton({label: 'Filter by clip list'});
    await waitForDeferredBlocks(fixture);
    if (clipToLogFilterStep) {
      const fakeClipsLists = [getFakeClipList(true, {id: overridesWithDefaults.clipListId})];
      clipToLogFilterStep.onClipListsChanged(fakeClipsLists);
    }
  } else {
    const flowOptions = await loader.getHarness(MatRadioGroupHarness);
    await flowOptions.checkRadioButton({label: 'Filter by file'});

    if (clipToLogFilterStep && overridesWithDefaults.fileName) {
      const files: NgxFileDropEntry[] = new DropFileEventMock(overridesWithDefaults.fileName).files;
      clipToLogFilterStep.onFileChanged(files);
    }
  }

  fixture.detectChanges();
  await fixture.whenStable();
};

export const fillOutputsStep = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  overrides: {
    mainLogsDirsText?: string;
    mainItrksDirText?: string;
    dependentLogsDirsText?: string;
    dependentItrksDirText?: string;
    fileName?: string;
  } = {},
): Promise<any> => {
  const defaults = {
    mainLogsDirsText: '/some/path-1/',
    mainItrksDirText: '/some/path/',
    dependentItrksDirText: '',
    dependentLogsDirsText: '',
    fileName: '',
  };
  const overridesWithDefaults = mergeDefaults(defaults, overrides);
  await waitForDeferredBlocks(fixture);
  if (overridesWithDefaults.mainItrksDirText) {
    const itrksControl = await MeInputHarness.setValue(
      fixture,
      loader,
      {ancestor: '.main-version-container', placeholder: 'Insert path to ITRK dir'},
      overridesWithDefaults.mainItrksDirText,
    );
    await (itrksControl as MatInputHarness).blur();
  }
  if (overridesWithDefaults.mainLogsDirsText) {
    const logDirsControl = await MeInputHarness.setValue(
      fixture,
      loader,
      {ancestor: '.main-version-container', placeholder: 'Insert path to log dir'},
      overridesWithDefaults.mainLogsDirsText,
    );
    await (logDirsControl as MatInputHarness).blur();
  }

  if (overridesWithDefaults.dependentItrksDirText) {
    const itrksControl = await MeInputHarness.setValue(
      fixture,
      loader,
      {ancestor: '.dependent-version-container', placeholder: 'Insert path to ITRK dir'},
      overridesWithDefaults.dependentItrksDirText,
    );
    await (itrksControl as MatInputHarness).blur();
  }
  if (overridesWithDefaults.dependentLogsDirsText) {
    const logDirsControl = await MeInputHarness.setValue(
      fixture,
      loader,
      {ancestor: '.dependent-version-container', placeholder: 'Insert path to log dir'},
      overridesWithDefaults.dependentLogsDirsText,
    );
    await (logDirsControl as MatInputHarness).blur();
  }

  fixture.detectChanges();
  await fixture.whenStable();
};

export const fillLogFileStep = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  logFileStep: LogFileStepComponent,
  overrides: {
    fileName?: string;
  } = {},
): Promise<any> => {
  const defaults = {
    fileName: '',
  };
  const overridesWithDefaults = mergeDefaults(defaults, overrides);
  if (overridesWithDefaults.fileName) {
    const files: NgxFileDropEntry[] = new DropFileEventMock(overridesWithDefaults.fileName).files;
    logFileStep.onFileChanged(files);
  }

  fixture.detectChanges();
  await fixture.whenStable();
};
