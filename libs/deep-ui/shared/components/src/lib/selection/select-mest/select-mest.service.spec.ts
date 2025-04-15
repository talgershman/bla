import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {MestService} from 'deep-ui/shared/core';

import {SelectMestService} from './select-mest.service';

describe('SelectMestService', () => {
  let spectator: SpectatorService<SelectMestService>;
  let service: SelectMestService;
  const createService = createServiceFactory({
    service: SelectMestService,
    providers: [MestService],
    imports: [],
  });
  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(SelectMestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('shouldIncludeClipListColumn', () => {
    it('should return true if "clipList" is included in overrideDisplayColumns and clipListOptions has more than one item', () => {
      const overrideDisplayColumns = ['otherColumn', 'clipList'];
      const clipListOptions: MeSelectOption[] = [
        {id: '1', value: 'Option 1'},
        {id: '2', value: 'Option 2'},
      ];

      const result = service.shouldIncludeClipListColumn(overrideDisplayColumns, clipListOptions);

      expect(result).toBe(true);
    });

    it('should return false if "clipList" is not included in overrideDisplayColumns', () => {
      const overrideDisplayColumns = ['otherColumn'];
      const clipListOptions: MeSelectOption[] = [
        {id: '1', value: 'Option 1'},
        {id: '2', value: 'Option 2'},
      ];

      const result = service.shouldIncludeClipListColumn(overrideDisplayColumns, clipListOptions);

      expect(result).toBe(false);
    });

    it('should return false if clipListOptions is empty', () => {
      const overrideDisplayColumns = ['clipList'];
      const clipListOptions: MeSelectOption[] = [];

      const result = service.shouldIncludeClipListColumn(overrideDisplayColumns, clipListOptions);

      expect(result).toBe(false);
    });
  });

  describe('generateDynamicPathsError', () => {
    it('should generate the error string correctly with all error types', () => {
      const executableError = 'Executable error message';
      const libError = 'Library error message';
      const brainLibError = 'Brain Library error message';

      const result = service.generateDynamicPathsError(executableError, libError, brainLibError);

      expect(result).toEqual('executable, lib, brain lib');
    });

    it('should handle missing error types', () => {
      const executableError = '';
      const libError = 'Library error message';
      const brainLibError = '';

      const result = service.generateDynamicPathsError(executableError, libError, brainLibError);

      expect(result).toEqual('lib');
    });

    it('should handle all error types missing', () => {
      const executableError = '';
      const libError = '';
      const brainLibError = '';

      const result = service.generateDynamicPathsError(executableError, libError, brainLibError);

      expect(result).toEqual('');
    });
  });

  describe('isOnlyMestRootPathChanged', () => {
    it('should return true when only the rootPath is changed', () => {
      const newMest = {
        id: 1,
        group: 'Group 1',
        nickname: 'Nickname 1',
        executables: ['exe1'],
        libs: ['lib1'],
        brainLibs: ['brainLib1'],
        args: 'Args 1',
        params: [],
        rootPath: '/new/root/path',
        isOverride: false,
      };

      const originalMest = {
        id: 1,
        group: 'Group 1',
        nickname: 'Nickname 1',
        executables: ['exe1'],
        libs: ['lib1'],
        brainLibs: ['brainLib1'],
        args: 'Args 1',
        params: [],
        rootPath: '/old/root/path',
        isOverride: false,
      };

      const result = service.isOnlyMestRootPathChanged(newMest as any, originalMest as any);

      expect(result).toBe(true);
    });
  });
});
