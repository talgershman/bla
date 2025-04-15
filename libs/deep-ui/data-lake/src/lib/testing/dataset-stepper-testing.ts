import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {HarnessLoader} from '@angular/cdk/testing';
import {ComponentFixture} from '@angular/core/testing';
import {MatIconHarness} from '@angular/material/icon/testing';
import {
  getElementBySelector,
  MeAgTableHarness,
  MeAutoCompleteChipHarness,
  MeAutoCompleteHarness,
  MeButtonHarness,
  MeChipHarness,
  MeInputHarness,
  MeSelectHarness,
  waitForDeferredBlocks,
} from '@mobileye/material/src/lib/testing';
import {
  arrayOperators,
  booleanOperators,
  closeListOperators,
  Dataset,
  Datasource,
  nullOperators,
  numberOperators,
  QEAttribute,
  stringOperators,
  ValueComponentType,
  VersionDataSource,
} from 'deep-ui/shared/models';
import {
  fakeBooleanQEAttribute,
  fakeFloatQEAttribute,
  fakeIntegerQEAttribute,
  fakeStringNoValuesQEAttribute,
  fakeStringWithValuesQEAttribute,
} from 'deep-ui/shared/testing';
import _camelCase from 'lodash-es/camelCase';
import _random from 'lodash-es/random';
import _sample from 'lodash-es/sample';
import _sampleSize from 'lodash-es/sampleSize';
import _startCase from 'lodash-es/startCase';
import {Observable, of} from 'rxjs';

export const fillDatasetForm = async (
  dataset: Partial<Dataset>,
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
): Promise<void> => {
  if (dataset.name) {
    await MeInputHarness.setValue(
      fixture,
      loader,
      {ancestor: '[title="Dataset Name"]'},
      dataset.name,
    );
  }

  if (dataset.team) {
    await MeSelectHarness.selectOptionByText(
      fixture,
      loader,
      docLoader,
      {ancestor: '[title="Team"]'},
      dataset.team,
    );
  }

  if (dataset.description) {
    await MeInputHarness.setValue(
      fixture,
      loader,
      {ancestor: '[title="Description (Optional)"]'},
      dataset.description,
    );
  }
};

export const clickAddSubQuery = async (fixture: ComponentFixture<any>): Promise<void> => {
  await waitForDeferredBlocks(fixture);
  const addQueryButton = getElementBySelector(fixture, '.add-query-button');
  addQueryButton.nativeElement.click();
  fixture.detectChanges();
  await fixture.whenStable();
};

export const clickRunQuery = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
): Promise<void> => {
  await MeButtonHarness.click(fixture, loader, {selector: '.run-query-button'});
};

export const clickEditSubQuery = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  dataSourceName: string,
): Promise<void> => {
  const iconHarness = await loader.getHarness<MatIconHarness>(
    MatIconHarness.with({
      name: 'edit',
      ancestor: `.sub-query-${dataSourceName.split(' ').join('-')}`,
    }),
  );
  const host = await iconHarness.host();
  await host.click();
  fixture.detectChanges();
  await fixture.whenStable();
};

export const clickViewOnlySubQuery = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  dataSourceName: string,
): Promise<void> => {
  const iconHarness = await loader.getHarness<MatIconHarness>(
    MatIconHarness.with({
      name: 'visibility',
      ancestor: `.sub-query-${dataSourceName.split(' ').join('-')}`,
    }),
  );
  const host = await iconHarness.host();
  await host.click();
};

export const clickRemoveSubQuery = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  dataSourceName: string,
): Promise<void> => {
  const iconHarness = await loader.getHarness<MatIconHarness>(
    MatIconHarness.with({
      name: 'delete_outline',
      ancestor: `.sub-query-${dataSourceName.split(' ').join('-')}`,
    }),
  );
  const host = await iconHarness.host();
  await host.click();
};

export const submitDataset = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  isEdit: boolean,
): Promise<void> => {
  await MeButtonHarness.click(fixture, loader, {
    text: !isEdit ? 'Create Dataset' : 'Update Dataset',
  });
};

export const submitSubQuery = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  isUpdate: boolean,
): Promise<void> => {
  await MeButtonHarness.click(fixture, loader, {text: isUpdate ? 'Update Query' : 'Add Query'});
  fixture.detectChanges();
  await fixture.whenStable();
};

export const addSubGroup = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  groupIndex: number,
): Promise<void> => {
  const groupIndexSelector = `.group-index-${groupIndex}`;
  await MeButtonHarness.click(fixture, loader, {text: '+(group)', ancestor: groupIndexSelector});
};

export const adjustGroupRel = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  groupIndex: number,
  condition: 'And' | 'Or',
): Promise<void> => {
  const groupIndexSelector = `.group-index-${groupIndex}`;
  await MeButtonHarness.click(fixture, loader, {
    text: `${condition}`,
    ancestor: groupIndexSelector,
  });
};

export const selectDatasource = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  tabLabel: string,
  name: string,
  groupIndex?: number,
  groupIndexes?: Array<number>,
): Promise<void> => {
  fixture.detectChanges();
  await fixture.whenStable();

  fixture.detectChanges();
  await fixture.whenStable();

  await MeChipHarness.selectChip(
    fixture,
    loader,
    {ancestor: 'me-chips-group-buttons'},
    {text: tabLabel},
  );

  fixture.detectChanges();
  await fixture.whenStable();

  await MeAgTableHarness.waitForTable(fixture);

  fixture.detectChanges();
  await fixture.whenStable();

  if (Array.isArray(groupIndexes)) {
    await MeAgTableHarness.clickRowsByValueAndGroupIndexes(fixture, name, groupIndexes);
  } else {
    await MeAgTableHarness.clickRowByValue(fixture, name, groupIndex);
  }

  await MeAgTableHarness.waitForLoadingToFinished(fixture);

  fixture.detectChanges();
  await fixture.whenStable();

  await MeButtonHarness.click(fixture, loader, {text: 'Next'});
};

export const adjustRule = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  attribute: QEAttribute,
  groupIndex: number,
  createNew: boolean,
  operator: string,
  valueType: ValueComponentType,
  value: string,
  values: Array<string> = [],
): Promise<void> => {
  const groupIndexSelector = `.group-index-${groupIndex}`;
  const optionText = _startCase(_camelCase(attribute.columnName));

  if (createNew) {
    await MeButtonHarness.click(fixture, loader, {text: '+Add', ancestor: groupIndexSelector});
  }

  await MeAutoCompleteHarness.selectOptionByText(
    fixture,
    loader,
    {ancestor: `${groupIndexSelector} .rules-container > :last-child .key-control`},
    {ancestor: `${groupIndexSelector} .rules-container > :last-child  .key-control`},
    optionText,
  );

  await MeSelectHarness.selectOptionByText(
    fixture,
    docLoader,
    docLoader,
    {ancestor: `${groupIndexSelector} .rules-container > :last-child .operator-control`},
    operator,
  );
  if (nullOperators.map((item) => item.value).includes(operator)) {
    // eslint-disable-next-line
    valueType = 'null';
  }
  switch (valueType) {
    case 'integer':
    case 'double':
    case 'string': {
      // insert name
      await MeInputHarness.setValue(
        fixture,
        loader,
        {ancestor: `${groupIndexSelector} .rules-container > :last-child  .value-control`},
        value,
      );
      break;
    }
    case 'autocomplete': {
      await MeAutoCompleteHarness.selectOptionByText(
        fixture,
        loader,
        {ancestor: `${groupIndexSelector} .rules-container > :last-child  .value-control`},
        {ancestor: `${groupIndexSelector} .rules-container > :last-child  .value-control`},
        value,
      );
      break;
    }
    case 'free-list': {
      for (const ruleValue of values) {
        await MeChipHarness.addTag(
          fixture,
          loader,
          {ancestor: `${groupIndexSelector} .rules-container > :last-child  .value-control`},
          ruleValue,
        );
      }
      break;
    }
    case 'list': {
      for (const ruleValue of values) {
        await MeAutoCompleteChipHarness.addTag(
          fixture,
          loader,
          {ancestor: `${groupIndexSelector} .rules-container > :last-child  .value-control`},
          {ancestor: `${groupIndexSelector} .rules-container > :last-child  .value-control`},
          ruleValue,
        );
      }
      break;
    }
    case 'boolean': {
      await MeSelectHarness.selectOptionByText(
        fixture,
        docLoader,
        docLoader,
        {ancestor: `${groupIndexSelector} .rules-container > :last-child  .value-control`},
        value,
      );
      break;
    }
    case 'null': {
      // do nothing , there is no value control
      break;
    }
    default: {
      throw new Error(`component value type not found`);
    }
  }
};

export const adjustAggRule = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  attribute: string,
  groupIndex: number,
  operator: string,
  value: string,
): Promise<void> => {
  const groupIndexSelector = `.group-index-${groupIndex}`;

  await MeSelectHarness.selectOptionByText(
    fixture,
    docLoader,
    docLoader,
    {ancestor: `${groupIndexSelector} .aggregation-rules .aggregate-key-control`},
    attribute,
  );

  await MeSelectHarness.selectOptionByText(
    fixture,
    docLoader,
    docLoader,
    {ancestor: `${groupIndexSelector} .aggregation-rules .operator-control`},
    operator,
  );

  await MeInputHarness.setValue(
    fixture,
    loader,
    {ancestor: `${groupIndexSelector} .value-control`},
    value,
  );
};

const randomStringNoValuesRule = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  groupIndex: number,
  createNew: boolean,
): Promise<void> => {
  const operator = _sample(stringOperators).value;
  if (arrayOperators.map((item) => item.value).includes(operator)) {
    await adjustRule(
      fixture,
      loader,
      docLoader,
      fakeStringNoValuesQEAttribute(),
      groupIndex,
      createNew,
      operator,
      'free-list',
      '',
      ['string1', 'string2'],
    );
  } else {
    await adjustRule(
      fixture,
      loader,
      docLoader,
      fakeStringNoValuesQEAttribute(),
      groupIndex,
      createNew,
      operator,
      'string',
      'some-string',
    );
  }
};

const randomStringWithValuesRule = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  groupIndex: number,
  createNew: boolean,
): Promise<void> => {
  const attr = fakeStringWithValuesQEAttribute();
  const operator = _sample(closeListOperators).value;
  const random = Math.floor(attr.values.length * Math.random());
  const sampleValues = _sampleSize(attr.values, random + 1);
  if (arrayOperators.map((item) => item.value).includes(operator)) {
    await adjustRule(
      fixture,
      loader,
      docLoader,
      attr,
      groupIndex,
      createNew,
      operator,
      'list',
      '',
      sampleValues,
    );
  } else {
    await adjustRule(
      fixture,
      loader,
      docLoader,
      attr,
      groupIndex,
      createNew,
      operator,
      'autocomplete',
      sampleValues[0],
    );
  }
};

const randomIntegerRule = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  groupIndex: number,
  createNew: boolean,
): Promise<void> => {
  const operator = _sample(numberOperators).value;
  const value = _random(1, 999999);
  await adjustRule(
    fixture,
    loader,
    docLoader,
    fakeIntegerQEAttribute(),
    groupIndex,
    createNew,
    operator,
    'integer',
    value.toString(),
  );
};

const randomFloatRule = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  groupIndex: number,
  createNew: boolean,
): Promise<void> => {
  const operator = _sample(numberOperators).value;
  const value = _random(1, 999999, true).toFixed(3);
  await adjustRule(
    fixture,
    loader,
    docLoader,
    fakeFloatQEAttribute(),
    groupIndex,
    createNew,
    operator,
    'double',
    value.toString(),
  );
};

const randomBooleanRule = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  groupIndex: number,
  createNew: boolean,
): Promise<void> => {
  const operator = _sample(booleanOperators).value;
  const value = _random(1, 2) > 1 ? 'True' : 'False';
  await adjustRule(
    fixture,
    loader,
    docLoader,
    fakeBooleanQEAttribute(),
    groupIndex,
    createNew,
    operator,
    'boolean',
    value,
  );
};

export const generateRandomRules = async (
  numberOfRules: number,
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  groupIndex: number,
): Promise<void> => {
  for (let i = 0; i < numberOfRules; i += 1) {
    const possibleRules = [
      () => randomStringNoValuesRule(fixture, loader, docLoader, groupIndex, i !== 0),
      () => randomStringWithValuesRule(fixture, loader, docLoader, groupIndex, i !== 0),
      () => randomIntegerRule(fixture, loader, docLoader, groupIndex, i !== 0),
      () => randomFloatRule(fixture, loader, docLoader, groupIndex, i !== 0),
      () => randomBooleanRule(fixture, loader, docLoader, groupIndex, i !== 0),
    ];
    const random = Math.floor(possibleRules.length * Math.random());
    await possibleRules[random]();
  }
};

export const fillQueryBuilderStep = async (
  fixture: ComponentFixture<any>,
  loader: HarnessLoader,
  docLoader: HarnessLoader,
  numberOfSubGroups: number,
  isUpdate?: boolean,
  disableAggRule?: boolean,
  numberOfRules?: number,
): Promise<void> => {
  try {
    await MeButtonHarness.click(fixture, loader, {
      text: 'Click here to add conditions',
    });
    // eslint-disable-next-line
  } catch (e) {}

  const rulesCount = numberOfRules || 1;
  if (!disableAggRule) {
    await adjustAggRule(fixture, loader, docLoader, 'Count', 1, 'Less', '123');
  }

  if (numberOfSubGroups >= 1) {
    // first group
    await adjustGroupRel(fixture, loader, 1, 'Or');
    await generateRandomRules(rulesCount, fixture, loader, docLoader, 1);
  }
  if (numberOfSubGroups >= 2) {
    // second group
    await addSubGroup(fixture, loader, 1);
    await generateRandomRules(rulesCount, fixture, loader, docLoader, 2);
  }
  if (numberOfSubGroups >= 3) {
    // third group
    await addSubGroup(fixture, loader, 2);
    await generateRandomRules(rulesCount, fixture, loader, docLoader, 3);
  }

  // submit query conditions
  await submitSubQuery(fixture, loader, isUpdate);
};

export const getFakeGetMultiVersionDataSource = (
  requestBody: IServerSideGetRowsRequest,
  dataSources: Array<Datasource>,
  versions: Array<VersionDataSource>,
): Observable<LoadSuccessParams> => {
  if (requestBody?.rowGroupCols.length && requestBody?.groupKeys.includes(dataSources[0].id)) {
    return of({
      rowData: versions,
      rowCount: 2,
    } as LoadSuccessParams);
  } else if (
    requestBody?.rowGroupCols.length &&
    requestBody?.groupKeys.includes(dataSources[1].id)
  ) {
    return of({
      rowData: [dataSources[1].datasourceversionSet[0]],
      rowCount: 1,
    } as LoadSuccessParams);
  } else if (
    requestBody?.rowGroupCols.length &&
    requestBody?.groupKeys.includes(dataSources[2].id)
  ) {
    return of({
      rowData: [dataSources[2].datasourceversionSet[0]],
      rowCount: 1,
    } as LoadSuccessParams);
  } else {
    return of({
      rowData: dataSources,
      rowCount: -1,
    } as LoadSuccessParams);
  }
};
