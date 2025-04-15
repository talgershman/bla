import {
  ColorPaletteIndexEnum,
  MeJsonMessageUiConfigs,
  MeJsonMessageUiValueConfigs
} from '@mobileye/material/src/lib/components/json-message/common';

export const ERROR_OBJ = {
  'error':
    'AllAWSBatchJobsFailed: Please check error logs to see all exceptions raised by the code or the error that prevented the container from starting.',
  'stacktrace':
    'Traceback (most recent call last):\n  File "/app/mini_deep_cloud/parsing_jobs/parsing_orchestrator.py", line 97, in handle\n    self.batch_manager.run()\n  File "/app/mini_deep_cloud/parsing_jobs/aws_batch_manager.py", line 64, in run\n    raise exc\n  File "/app/mini_deep_cloud/parsing_jobs/aws_batch_manager.py", line 58, in run\n    self._wait_till_all_jobs_finished()\n  File "/app/mini_deep_cloud/parsing_jobs/aws_batch_manager.py", line 291, in _wait_till_all_jobs_finished\n    raise AllAWSBatchJobsFailed("Please check error logs to see all exceptions raised by the "\nmini_deep_cloud.parsing_jobs.exceptions.AllAWSBatchJobsFailed: Please check error logs to see all exceptions raised by the code or the error that prevented the container from starting.\n',
};

export const DEFAULT_OBJ = {
  'cloud-mest_info': {
    'cmd':
      '/usr/bin/cloud-mest -m /mobileye/algo_ci4/forks/algo/bundle/MR-1254/3/output_folder/eyeq4/sw_tbb/rel/Wono/EyeQ4sw_tbb_rel/applications/GVPU/GV_Wono /mobileye/algo_ci4/forks/algo/bundle/MR-1254/3/output_folder/eyeq4/sw_tbb/rel/Wono/EyeQ4sw_tbb_rel/applications/GVPI/brain/libWono.so /mobileye/algo_ci4/forks/algo/bundle/MR-1254/3/output_folder/eyeq4/sw_tbb/rel/Wono/EyeQ4sw_tbb_rel/applications/GVPI/brain -p "detectLtap=false matching=1 -sAllowRunNoYawRate -sAllowRunNoSpeed -sIgnoreAgeTrustAccel -sPrintFCV_FP FCWApplication=IPB runFreeSpace=true allowedAlertsOnOncoming=true alertsOnVD3D=true -sFCWLog itrk-cfg=/mobileye/FCF_AEB_FPA/run_files/DEEP_confs/VD.txt" -c s3://mobileye-deep.data-loader.clip-list.prod1/ea055392-7bd2-11ee-96ca-0a58a9feac02/mest/clip_list.txt -n deep_ea055392-0a58a9feac02 -o /mobileye/fpa_reports/deep_mest/ea055392-7bd2-11ee-96ca-0a58a9feac02 --output-uri s3://mobileye-deep.data-loader.itrks.prod1/caab94694f114738d02991e74c53a6bd --ignore-missing --user s_algo_deep',
    'run id': 'deep_ea055392-0a58a9feac02_s_algo_deep_20231105_120645_449731w',
    'commands count': 133,
    'output location':
      's3://mobileye-deep.data-loader.itrks.prod1/caab94694f114738d02991e74c53a6bd/deep_ea055392-0a58a9feac02_s_algo_deep_20231105_120645_449731w/',
    'output local folder': '/mobileye/fpa_reports/deep_mest/ea055392-7bd2-11ee-96ca-0a58a9feac02',
  },
  'MEST_outputs_sources': {
    'New': 133,
    'Total': 133,
    'Cached': 0,
  },
  'MEST_outputs_summary': {
    'Total': 133,
    'Valid': 133,
  },
  'MEST_outputs_locations': [
    's3://mobileye-deep.data-loader.itrks.prod1/caab94694f114738d02991e74c53a6bd/deep_ea055392-0a58a9feac02_s_algo_deep_20231105_120645_449731w/',
  ],
};

export const LINK_OBJ = {
  ui_configs: {
    keys: {
      'output location' :{
        uiValueConfigs: {
          value: 'https://www.ynet.co.il',
          linkTitle: 'click here',
        } as MeJsonMessageUiValueConfigs,
      }
    }
  },
  'cloud-mest info': {
    'run id': 'deep_ea055392-0a58a9feac02_s_algo_deep_20231105_120645_449731w',
    'commands count': 133,
    'output location': null
  },
};

export const ALL_OBJ = {
  uiConfigs: {
    expandAll: true,
    keys: {
      MEST_outputs_sources: {
        uiKeyConfigs: {
          order: 1,
          expanded: false,
          title: 'Your NEW TITLE FOR MEST OUTPUTS',
        },
        uiValueConfigs: {},
      },
      cmd: {
        uiKeyConfigs: {},
        uiValueConfigs: {
          html: '',
          color: ColorPaletteIndexEnum.ColorPaletteIndexGreen,
          bold: true,
        },
      },
      cloud_mest_output: {
        uiKeyConfigs: {
          bold: true,
          color: ColorPaletteIndexEnum.ColorPaletteIndexRed,
          tooltip: 'this tooltip comes from global settings : uiKeyConfigs',
          order: 2,
          expanded: true,
        },
        uiValueConfigs: {},
      },
    },
  } as MeJsonMessageUiConfigs,
  details: {
    cloud_mest_output: {
      cmd: '/usr/bin/cloud-mest -m /mobileye/algo_ci4/algo/ds-sm/MR-4959/7/output_folder/eyeq5/sw_tbb/rel/Mono8/EyeQ5sw_tbb_rel/applications/CV/CV_GV.s5 /mobileye/algo_ci4/algo/ds-sm/MR-4959/7/output_folder/eyeq5/sw_tbb/rel/Mono8/EyeQ5sw_tbb_rel/applications/GVPI/brain/libMono8.so /mobileye/algo_ci4/algo/ds-sm/MR-4959/7/output_folder/eyeq5/sw_tbb/rel/Mono8/EyeQ5sw_tbb_rel/applications/GVPI/brain -p \\"enableTrafficLights=true itrk-cfg=/mobileye//TFL_FPA/Configs/modules.txt -sTsrDebugIshow --itrk-gz --order -sno_i386 nnPmaEnabled=false\\" -c s3://mobileye-deep.data-loader.clip-list.prod1/50d8275a-83aa-11ee-a819-0a58a9feac02/mest/clip_list.txt -n deep_50d8275a-0a58a9feac02 -o /mobileye/fpa_reports/deep_mest/50d8275a-83aa-11ee-a819-0a58a9feac02 --output-uri s3://mobileye-deep.data-loader.itrks.prod1/75676cc557070930d7427861238d33ce --timeout 0 --ignore-missing --user s_algo_deep',
    },
    MEST_outputs_sources: {
      new: 66,
      total: 66,
      cached: 0,
    },
    results: {
      perfAccuracyDataSchema: {
        parquet_path:
          'mobileye-deep.bi-reports.prod1/fpa/road/ool/data-prep/perfAccuracyDataSchema/ool_version_4_23_12_release_20k_3/3553ce0e-839f-11ee-a819-0a58a9feac02',
        regular_number_color: 3254,
        clips_in_classifier: 34354,
        data_source_creation_result:
          'data-source was created successfully, name: perfAccuracyDataSchema_ool_version_4_23_12_release_20k_3_3553ce0e',
      },
    },
  },
} as any;


export const HTML_OBJ = {
  ui_configs: {
    keys: {
      'output location' : {
        uiValueConfigs: {
          html: "<span>very nice html here <a target='_blank' href='https://www.ynet.co.il'>click here</a>",
        } as MeJsonMessageUiValueConfigs,
      }
    }
  },
  'cloud-mest info': {
    'commands count': 133,
    'output location': null
  },
};
