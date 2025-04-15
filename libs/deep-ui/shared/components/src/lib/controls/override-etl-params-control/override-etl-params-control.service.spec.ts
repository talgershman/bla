import {ChangeDetectorRef} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator';
import {DEFAULT_RETRY_ATTEMPTS, OnPremService, QueryFileSystem} from 'deep-ui/shared/core';
import {EtlServiceTypes} from 'deep-ui/shared/models';
import {getFakeEtlDagService} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {ServiceFormValue, ServicesDagObject} from './entites';
import {OverrideEtlParamsControlService} from './override-etl-params-control.service';

describe('OverrideEtlParamsControlService', () => {
  let spectator: SpectatorService<OverrideEtlParamsControlService>;
  let cd: ChangeDetectorRef;
  let onPremService: SpyObject<OnPremService>;

  const createService = createServiceFactory({
    service: OverrideEtlParamsControlService,
    mocks: [OnPremService],
    providers: [],
  });

  beforeEach(() => {
    spectator = createService();
    onPremService = spectator.inject(OnPremService);
    const fakeResponse: QueryFileSystem = {
      retries: DEFAULT_RETRY_ATTEMPTS,
      paths: [
        {
          absolutePath: 'some-path/other-path/file1.txt',
          type: 'file',
          found: true,
        },
      ],
    };

    onPremService.queryFileSystem.and.returnValue(of(fakeResponse));
    cd = {
      detectChanges: () => {},
    } as any;
  });

  describe('addControls', () => {
    it('should add controls to servicesController', () => {
      const servicesDag: any = {
        root: '1',
        1: '2',
      };
      const service1 = getFakeEtlDagService(true, {id: 1, type: EtlServiceTypes.DataPrep});
      const service2 = getFakeEtlDagService(true, {id: 2, type: EtlServiceTypes.ProbeLogic});
      const services: ServicesDagObject = {
        1: service1,
        2: service2,
      };
      const servicesController = new FormArray([]);
      const initialOverrideParams = {};

      spectator.service.addControls(
        servicesDag,
        services,
        servicesController,
        initialOverrideParams,
        cd,
      );

      expect(servicesController.length).toBe(2);
    });

    it('should not add controls if servicesDag is empty', () => {
      const servicesDag = {} as ServicesDagObject;
      const services = servicesDag;
      const servicesController = new FormArray([]);
      const reTriggerJobUserParams = {};

      spectator.service.addControls(
        servicesDag,
        services,
        servicesController,
        reTriggerJobUserParams,
        cd,
      );

      expect(servicesController.length).toBe(0);
    });
  });

  describe('generateUploadFilesFormControl', () => {
    it('should generate upload files form control', () => {
      const pathValue = 'testPath';
      const formGroup = spectator.service.generateUploadFilesFormControl(pathValue, cd);

      expect(formGroup instanceof FormGroup).toBeTrue();
      expect(formGroup.controls['type'] instanceof FormControl).toBeTrue();
      expect(formGroup.controls['path'] instanceof FormControl).toBeTrue();
      expect(formGroup.controls['path'].value).toEqual(pathValue);
    });
  });

  describe('serializeControlValue', () => {
    it('should serialize control value with params and upload files', () => {
      // Arrange
      const servicesValue = [
        {
          type: 'Type1',
          id: '1',
          params: {key: 'value'},
          uploadFiles: [{type: 'file', path: '/path/to/file'}],
        },
        {type: 'Type2', id: '2', params: {anotherKey: 'anotherValue'}, uploadFiles: []},
      ] as any;

      // Act
      const serializedValue = spectator.service.serializeControlValue(servicesValue);

      // Assert
      expect(serializedValue.params).toBeDefined();
      expect(serializedValue.params['Type1']).toBeDefined();
      expect(serializedValue.params['Type1'].id).toEqual(1);
      expect(serializedValue.params['Type1'].configuration.key).toEqual('value');
      expect(serializedValue.params['Type1'].configuration.upload_files.length).toEqual(1);
      expect(serializedValue.params['Type2']).toBeDefined();
      expect(serializedValue.params['Type2'].id).toEqual(2);
      expect(serializedValue.params['Type2'].configuration.anotherKey).toEqual('anotherValue');
      expect(serializedValue.params['Type2'].configuration.upload_files.length).toEqual(0);
    });

    it('should serialize control value without upload files', () => {
      const servicesValue: Array<ServiceFormValue> = [
        {
          title: 'title 1',
          type: EtlServiceTypes.DataPrep,
          id: '1',
          params: {
            temp: 1,
          },
          uploadFiles: [
            {
              type: 'folder 1',
              path: '/mob/',
            },
            {
              type: 'file',
              path: 'moshe.txt',
            },
          ],
        },
      ];

      const serializedValue = spectator.service.serializeControlValue(servicesValue);

      expect(serializedValue.params).toEqual({
        [EtlServiceTypes.DataPrep]: {
          id: 1,
          configuration: {
            temp: 1,
            upload_files: [
              {type: 'folder 1', path: '/mob/'},
              {type: 'file', path: 'moshe.txt'},
            ],
          },
        },
      });
    });

    it('should serialize control value without params and upload files', () => {
      // Arrange
      const servicesValue = [];

      // Act
      const serializedValue = spectator.service.serializeControlValue(servicesValue);

      // Assert
      expect(serializedValue.params).toBeDefined();
      expect(Object.keys(serializedValue.params).length).toEqual(0);
    });
  });

  describe('getFixAttributes', () => {
    it('should remove unused keys', () => {
      const serviceParamsControlValue = {
        a: true,
        b: {
          a: 123,
          c: [12],
        },
        c: '123',
      };
      const initialServiceValue = {
        a: false,
        b: {
          d: 123,
        },
      };

      const fixAttributes = spectator.service.getFixAttributes(
        serviceParamsControlValue,
        initialServiceValue,
      );

      expect(fixAttributes).toEqual({
        a: true,
        b: {
          d: 123,
        },
      });
    });

    it('should add missing keys', () => {
      const serviceParamsControlValue = {
        a: true,
        b: {
          a: '123',
          b: '777',
        },
      };
      const initialServiceValue = {
        a: true,
        b: {
          a: '1',
          b: '7',
          c: '888',
        },
        c: 123,
      };

      const fixAttributes = spectator.service.getFixAttributes(
        serviceParamsControlValue,
        initialServiceValue,
      );

      expect(fixAttributes).toEqual({
        a: true,
        b: {
          a: '123',
          b: '777',
          c: '888',
        },
        c: 123,
      });
    });

    it('should merge but ignore array values', () => {
      const serviceParamsControlValue = {
        'FrameClassifier': {
          'tech': 'pd',
          'schema': {
            'perfects_fields_schema_ret': [
              {
                'id': 'int64',
              },
              {
                'gfi': 'int64',
              },
              {
                'de_road': 'category',
              },
              {
                'type': 'category',
              },
              {
                'de_environment_type': 'category',
              },
              {
                'angle_middle': 'float64',
              },
              {
                'cam_port': 'int64',
              },
              {
                'grab_index': 'int64',
              },
              {
                'group': 'category',
              },
              {
                'width': 'float64',
              },
              {
                'camera': 'category',
              },
              {
                'de_weather': 'category',
              },
              {
                'image_focal_length': 'float64',
              },
              {
                'ego_speed': 'float64',
              },
              {
                'clustering_is_true': 'category',
              },
              {
                'clustering_any_camera_true': 'category',
              },
              {
                'clustering_closest_version_id': 'float64',
              },
              {
                'clustering_coverage': 'category',
              },
              {
                'clustering_any_cam_coverage': 'category',
              },
              {
                'de_lighting_condition': 'category',
              },
              {
                'is_in_slow_agenda': 'bool',
              },
              {
                'perfected_in_all_cameras': 'bool',
              },
              {
                'occluded': 'boolean',
              },
              {
                'clustering_closest_is_approved': 'bool',
              },
              {
                'clustering_closest_version_id': 'float64',
              },
              {
                'clustering_second_closest_version_id': 'float64',
              },
              {
                'clustering_closest_intersection_over_union': 'float64',
              },
              {
                'clustering_second_closest_intersection_over_union': 'float64',
              },
              {
                'clustering_closest_overlap_over_min': 'float64',
              },
              {
                'clustering_second_closest_overlap_over_min': 'float64',
              },
              {
                'dynamics': 'category',
              },
              {
                'contrast': 'category',
              },
              {
                'on_road': 'boolean',
              },
              {
                'waist_up': 'boolean',
              },
              {
                'group': 'category',
              },
              {
                'distance': 'float64',
              },
              {
                'height_bottom_distance': 'float64',
              },
              {
                'bottom_distance': 'float64',
              },
              {
                'height_distance': 'float64',
              },
              {
                'lat_dist_calc': 'float64',
              },
              {
                'long_dist_calc': 'float64',
              },
              {
                'occluded_by': 'category',
              },
              {
                'occlusion': 'category',
              },
              {
                'occluded_from': 'category',
              },
              {
                'height': 'category',
              },
              {
                'aeb_scenario': 'category',
              },
              {
                'aeb_last_frame_for_testing': 'float64',
              },
            ],
          },
          'agendas': {
            'fast': [],
            'slow': ['clustering'],
          },
          'is_true': 'is_true',
          'max_distance': 'inf',
          'min_valid_gfi': 0,
          'excluded_types': [
            'ignore',
            'invalid',
            'bike',
            'wheels',
            'other',
            'scooter',
            'dummy_bike',
          ],
          'any_camera_true': 'any_camera_true',
          'close_to_bottom': null,
          'coverage_column': 'coverage',
          'min_valid_width': 0,
          'only_vd_relevant': false,
          'type_column_name': 'type',
          'suppressed_prefix': null,
          'width_column_name': 'width',
          'closest_version_id': 'closest_version_id',
          'true_overlap_score': 0.4,
          'ready_to_use_params': false,
          'top_distance_from_p': 't_distance_from_p',
          'distance_column_name': null,
          'left_distance_from_p': 'l_distance_from_p',
          'closest_harsh_overlap': 'closest_harsh_overlap',
          'is_in_slow_agenda_col': null,
          'right_distance_from_p': 'r_distance_from_p',
          'bottom_distance_from_p': 'b_distance_from_p',
          'any_cam_coverage_column': 'any_cam_coverage',
          'true_overlap_bike_score': 0.4,
          'vd_relevant_column_name': 'vd_relevance',
          'closest_overlap_over_min': 'closest_overlap_over_min',
          'second_closest_version_id': 'second_closest_version_id',
          'second_closest_harsh_overlap': 'second_closest_harsh_overlap',
          'closest_intersection_over_union': null,
          'second_closest_overlap_over_min': 'second_closest_overlap_over_min',
          'iou_to_closest_object_column_name': 'closest_intersection_over_union',
          'diou_to_closest_object_column_name': null,
          'closest_version_id_column_for_merge': 'closest_version_id',
          'second_closest_intersection_over_union': 'second_closest_intersection_over_union',
          'width_iou_to_closest_object_column_name': null,
          'second_iou_to_closest_object_column_name': 'second_closest_intersection_over_union',
          'second_diou_to_closest_object_column_name': null,
          'second_width_iou_to_closest_object_column_name': null,
        },
      };
      const initialServiceValue = {
        'FrameClassifier': {
          'tech': 'open_door',
          'schema': {
            'perfects_fields_schema_ret': [
              {
                'id': 'int64',
              },
              {
                'open_door_coverage': 'category',
              },
              {
                'open_door_hf_disabled_coverage': 'category',
              },
              {
                'mf_any_cam_coverage': 'category',
              },
              {
                'miss_cause': 'category',
              },
              {
                'vehicle_distance': 'float64',
              },
              {
                'vehicle_headway': 'float64',
              },
              {
                'vehicle_approved_age': 'float64',
              },
              {
                'open_door': 'boolean',
              },
              {
                'door_type': 'category',
              },
              {
                'door_dynamic': 'category',
              },
              {
                'door_open_toward_road': 'boolean',
              },
              {
                'occluded': 'category',
              },
              {
                'cipv': 'boolean',
              },
              {
                'lane': 'category',
              },
              {
                'visible_side_left_right': 'category',
              },
              {
                'visible_side_front_back': 'category',
              },
              {
                'grab_index': 'int64',
              },
              {
                'gfi': 'int64',
              },
              {
                'cam_port': 'int64',
              },
              {
                'de_road': 'category',
              },
              {
                'de_country': 'category',
              },
              {
                'de_weather': 'category',
              },
              {
                'de_tech_vd': 'category',
              },
              {
                'de_environment_type': 'category',
              },
              {
                'de_lighting_condition': 'category',
              },
              {
                'type': 'category',
              },
              {
                'orient_state': 'category',
              },
              {
                'distance': 'float64',
              },
              {
                'lat_dist_calc': 'float64',
              },
              {
                'long_dist_calc': 'float64',
              },
              {
                'group': 'category',
              },
              {
                'width': 'float64',
              },
              {
                'height': 'float64',
              },
              {
                'camera': 'category',
              },
              {
                'image_focal_length': 'float64',
              },
              {
                'ego_speed': 'float64',
              },
              {
                'yaw_rate': 'float64',
              },
              {
                'gear_state': 'category',
              },
              {
                'is_in_slow_agenda': 'bool',
              },
              {
                'aeb_scenario': 'category',
              },
              {
                'aeb_first_frame_for_testing': 'category',
              },
              {
                'aeb_last_frame_for_testing': 'category',
              },
              {
                'aeb_clip_useable': 'category',
              },
              {
                'open_door_is_true': 'category',
              },
              {
                'open_door_any_camera_true': 'category',
              },
              {
                'open_door_any_cam_coverage': 'category',
              },
              {
                'area': 'float64',
              },
            ],
          },
          'agendas': {
            'fast': [],
            'slow': ['mf', 'open_door_hf_disabled', 'open_door'],
          },
          'max_distance': 'inf',
          'min_valid_gfi': 0,
          'close_to_bottom': 0.22,
          'min_valid_width': 0,
          'true_overlap_score': 0.2,
          'true_overlap_bike_score': 0.4,
          'all_columns_from_version': true,
        },
      };

      const fixAttributes = spectator.service.getFixAttributes(
        serviceParamsControlValue,
        initialServiceValue,
      );

      expect(fixAttributes).toEqual({
        'FrameClassifier': {
          'tech': 'pd',
          'schema': {
            'perfects_fields_schema_ret': [
              {
                'id': 'int64',
              },
              {
                'gfi': 'int64',
              },
              {
                'de_road': 'category',
              },
              {
                'type': 'category',
              },
              {
                'de_environment_type': 'category',
              },
              {
                'angle_middle': 'float64',
              },
              {
                'cam_port': 'int64',
              },
              {
                'grab_index': 'int64',
              },
              {
                'group': 'category',
              },
              {
                'width': 'float64',
              },
              {
                'camera': 'category',
              },
              {
                'de_weather': 'category',
              },
              {
                'image_focal_length': 'float64',
              },
              {
                'ego_speed': 'float64',
              },
              {
                'clustering_is_true': 'category',
              },
              {
                'clustering_any_camera_true': 'category',
              },
              {
                'clustering_closest_version_id': 'float64',
              },
              {
                'clustering_coverage': 'category',
              },
              {
                'clustering_any_cam_coverage': 'category',
              },
              {
                'de_lighting_condition': 'category',
              },
              {
                'is_in_slow_agenda': 'bool',
              },
              {
                'perfected_in_all_cameras': 'bool',
              },
              {
                'occluded': 'boolean',
              },
              {
                'clustering_closest_is_approved': 'bool',
              },
              {
                'clustering_closest_version_id': 'float64',
              },
              {
                'clustering_second_closest_version_id': 'float64',
              },
              {
                'clustering_closest_intersection_over_union': 'float64',
              },
              {
                'clustering_second_closest_intersection_over_union': 'float64',
              },
              {
                'clustering_closest_overlap_over_min': 'float64',
              },
              {
                'clustering_second_closest_overlap_over_min': 'float64',
              },
              {
                'dynamics': 'category',
              },
              {
                'contrast': 'category',
              },
              {
                'on_road': 'boolean',
              },
              {
                'waist_up': 'boolean',
              },
              {
                'group': 'category',
              },
              {
                'distance': 'float64',
              },
              {
                'height_bottom_distance': 'float64',
              },
              {
                'bottom_distance': 'float64',
              },
              {
                'height_distance': 'float64',
              },
              {
                'lat_dist_calc': 'float64',
              },
              {
                'long_dist_calc': 'float64',
              },
              {
                'occluded_by': 'category',
              },
              {
                'occlusion': 'category',
              },
              {
                'occluded_from': 'category',
              },
              {
                'height': 'category',
              },
              {
                'aeb_scenario': 'category',
              },
              {
                'aeb_last_frame_for_testing': 'float64',
              },
            ],
          },
          'agendas': {
            'fast': [],
            'slow': ['clustering'],
          },
          'max_distance': 'inf',
          'min_valid_gfi': 0,
          'close_to_bottom': null,
          'min_valid_width': 0,
          'true_overlap_score': 0.4,
          'true_overlap_bike_score': 0.4,
          'all_columns_from_version': true,
        },
      });
    });
  });
});
