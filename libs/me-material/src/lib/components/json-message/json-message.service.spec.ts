import {
  ColorPaletteIndexEnum,
  MeJsonMessageUiConfigs,
  MeJsonMessageUiKeyConfigs,
  MeJsonMessageUiValueConfigs,
} from '@mobileye/material/src/lib/components/json-message/common';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeJsonMessageService} from './json-message.service';

describe('MeJsonMessageService', () => {
  let spectator: SpectatorService<MeJsonMessageService>;

  const createService = createServiceFactory({
    service: MeJsonMessageService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('convertToWords', () => {
    it('should capitalize and format words', () => {
      const result = spectator.service.convertToWords('MEST outputs');

      expect(result).toEqual('MEST Outputs');
    });

    it('should capitalize and format words for a title', () => {
      const result = spectator.service.convertToWords('some title');

      expect(result).toEqual('Some Title');
    });

    it('should replace underscores with spaces', () => {
      const result = spectator.service.convertToWords('some_s3_path');

      expect(result).toEqual('Some s3 path');
    });

    it('should handle multiple words and capitalize appropriately', () => {
      const result = spectator.service.convertToWords('another Test');

      expect(result).toEqual('Another Test');
    });
  });

  describe('getValueConfigValue', () => {
    const regularMsg = {
      test: 'bla',
      nested: {
        test1: true,
        otherTest: 123,
      },
      arr1: ['one', 'two', 'three'],
    };
    it('should get default value', () => {
      const result = spectator.service.getValueConfigValue(regularMsg, null, '', '', 'test', 'bla');

      expect(result).toEqual({
        tooltip: '',
        color: ColorPaletteIndexEnum.ColorPaletteIndexGreen,
        html: '',
        bold: false,
        linkTitle: '',
        value: 'bla',
      } as MeJsonMessageUiValueConfigs);
    });

    it('with global - but key not found - return default', () => {
      const global: MeJsonMessageUiConfigs = {
        expandAll: false,
        keys: {
          test1: {
            uiKeyConfigs: {},
            uiValueConfigs: {
              html: '<div>some html</div>',
            } as MeJsonMessageUiValueConfigs,
          },
        },
      };
      const result = spectator.service.getValueConfigValue(
        regularMsg,
        global,
        '',
        '',
        'not-found',
        'bla-value',
      );

      expect(result).toEqual({
        tooltip: '',
        color: ColorPaletteIndexEnum.ColorPaletteIndexGreen,
        html: '',
        bold: false,
        linkTitle: '',
        value: 'bla-value',
      } as MeJsonMessageUiValueConfigs);
    });

    it('should get custom value from global', () => {
      const global: MeJsonMessageUiConfigs = {
        expandAll: false,
        keys: {
          test1: {
            uiKeyConfigs: {},
            uiValueConfigs: {
              html: '<div>some html</div>',
            } as MeJsonMessageUiValueConfigs,
          },
        },
      };
      const result = spectator.service.getValueConfigValue(
        regularMsg,
        global,
        '',
        '',
        'test1',
        true,
      );

      expect(result).toEqual({
        tooltip: '',
        color: ColorPaletteIndexEnum.ColorPaletteIndexBlack,
        html: '<div>some html</div>',
        bold: false,
        linkTitle: '',
        value: true,
      } as MeJsonMessageUiValueConfigs);
    });

    it('should get custom value of parent when array', () => {
      const global: MeJsonMessageUiConfigs = {
        expandAll: false,
        keys: {
          test1: {
            uiKeyConfigs: {},
            uiValueConfigs: {
              html: '<div>some html</div>',
            } as MeJsonMessageUiValueConfigs,
          },
          arr1: {
            uiKeyConfigs: {},
            uiValueConfigs: {
              bold: true,
              color: ColorPaletteIndexEnum.ColorPaletteIndexRed,
            } as MeJsonMessageUiValueConfigs,
          },
        },
      };
      const result = spectator.service.getValueConfigValue(
        regularMsg,
        global,
        'arr1',
        'array',
        '0',
        'one',
      );

      expect(result).toEqual({
        tooltip: '',
        color: ColorPaletteIndexEnum.ColorPaletteIndexRed,
        html: '',
        bold: true,
        linkTitle: '',
        value: 'one',
      } as MeJsonMessageUiValueConfigs);
    });
  });

  describe('getKeyConfigValue', () => {
    it('should get default value', () => {
      const result = spectator.service.getKeyConfigValue(null, 'test');

      expect(result).toEqual({
        tooltip: '',
        color: ColorPaletteIndexEnum.ColorPaletteIndexBlack,
        bold: false,
        order: 9999,
        expanded: true,
        title: 'Test',
      } as MeJsonMessageUiKeyConfigs);
    });

    it('with global - but key not found - return default', () => {
      const global: MeJsonMessageUiConfigs = {
        expandAll: false,
        keys: {
          test1: {
            uiKeyConfigs: {
              bold: true,
              title: 'some other title',
              expanded: true,
              order: 1,
              color: ColorPaletteIndexEnum.ColorPaletteIndexBlue,
              tooltip: 'some tooltip',
            },
            uiValueConfigs: {} as MeJsonMessageUiKeyConfigs,
          },
        },
      };
      const result = spectator.service.getKeyConfigValue(global, 'not-found');

      expect(result).toEqual({
        tooltip: '',
        color: ColorPaletteIndexEnum.ColorPaletteIndexBlack,
        bold: false,
        order: 9999,
        expanded: false,
        title: 'Not-found',
      } as MeJsonMessageUiKeyConfigs);
    });

    it('should get custom value from global', () => {
      const global: MeJsonMessageUiConfigs = {
        expandAll: false,
        keys: {
          test1: {
            uiKeyConfigs: {
              tooltip: 'key tooltip',
              color: ColorPaletteIndexEnum.ColorPaletteIndexRed,
              html: '',
              bold: true,
              linkTitle: '',
              order: 1,
              expanded: true,
              title: 'this is a new title',
            } as MeJsonMessageUiKeyConfigs,
            uiValueConfigs: {},
          },
        },
      };
      const result = spectator.service.getKeyConfigValue(global, 'test1');

      expect(result).toEqual({
        tooltip: 'key tooltip',
        color: ColorPaletteIndexEnum.ColorPaletteIndexRed,
        html: '',
        bold: true,
        linkTitle: '',
        order: 1,
        expanded: true,
        title: 'this is a new title',
      } as MeJsonMessageUiKeyConfigs);
    });
  });

  describe('convertObjectToCamelCase', () => {
    it('should convert object keys to camel case', () => {
      const inputObject = {
        snake_case_key: 'value',
        nested_object: {
          nested_key: 'nested_value',
        },
        array_key: [
          {array_nested_key: 'array_nested_value'},
          {another_array_nested_key: 'another_array_nested_value'},
        ],
      };

      const attributesToConvert = ['snake_case_key', 'nested_object', 'array_key'];

      const result = spectator.service.convertObjectToCamelCase(inputObject, attributesToConvert);

      expect(result).toEqual({
        snakeCaseKey: 'value',
        nestedObject: {nested_key: 'nested_value'},
        arrayKey: [
          {array_nested_key: 'array_nested_value'},
          {another_array_nested_key: 'another_array_nested_value'},
        ],
      });
    });

    it('should handle null and undefined values gracefully', () => {
      const inputObject = {
        nullKey: null,
        undefinedKey: undefined,
        nestedObject: {
          nestedNullKey: null,
          nestedUndefinedKey: undefined,
        },
        arrayWithNull: [null, 'value1', null],
      };

      const attributesToConvert = ['nullKey', 'undefinedKey', 'nestedObject', 'arrayWithNull'];

      const result = spectator.service.convertObjectToCamelCase(inputObject, attributesToConvert);

      // Verify that null and undefined values are handled gracefully
      expect(result.nullKey).toBeNull();
      expect(result.undefinedKey).toBeUndefined();

      expect(result.nestedObject.nestedNullKey).toBeNull();
      expect(result.nestedObject.nestedUndefinedKey).toBeUndefined();

      expect(result.arrayWithNull).toEqual([null, 'value1', null]);
    });
  });
});
