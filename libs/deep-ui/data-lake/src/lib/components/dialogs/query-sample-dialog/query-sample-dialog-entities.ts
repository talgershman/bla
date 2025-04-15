import {SampleGFIMetadata} from '../../../services/web-sockets-manager/clips-sample/clips-sample-web-sockets-manager.service';

export const cameraOptions: string[] = [
  'main',
  'narrow',
  'fisheye',
  'rear',
  'rearCornerLeft',
  'rearCornerRight',
  'frontCornerLeft',
  'frontCornerRight',
  'parking_front',
  'parking_rear',
  'parking_left',
  'parking_right',
];

export const exposureOptions: string[] = ['IMG1', 'IMG2', 'IMG3', 'IMG4'];

export const pyramidOptions: string[] = [
  'raw',
  'tm_int',
  'reds',
  'reds_wideFOV',
  'redness',
  'ltm',
  'tm_rectified',
  'tm_int_ncap100',
  'ltm_rectified_ncap100',
  'ltm_wideFOV',
];

export const pyramidLevelOptions: string[] = ['', '-3', '-2', '-1', '0', '1', '2', '3', '4', '5'];

export enum ClipSampleMetadataStatus {
  NotSet,
  Loaded,
  Error,
}

export type ClipSampleMetadata = SampleGFIMetadata & {
  src: string;
  status: ClipSampleMetadataStatus;
  frameId: number;
};

export const CLIPS_SAMPLE_SIZE = 100;

export const IMAGE_SERVICE_JIRA_TICKET =
  'https://jira.mobileye.com/secure/CreateIssueDetails%21init.jspa?pid=15041&issuetype=3&priority=4&components=20212&labels=cloudML&labels=cloudImageService&summary=Data+Warming+Request+for+%3CPLEASE+WRITE+YOUR+TEAM+NAME+HERE%3E&description=Hello,%0A%0AI+want+to+warm+up+data+in+image+service.%0A%0AWarming+Info%0APath+to+clip+list:+%3CPLEASE+WRITE+TO+CLIP+LIST+HERE+AND+APPEND+IT+TO+THE+TICKET%3E%0AAmount+of+clips+I+want+to+warm:+%3CHOW+MANY+CLIPS+IN+THE+LIST%3E%0A%0AWhat+I+want+to+warm+is:%0AExposures:+%3CTHE+EXPOSURES+I+WANT%3E%0ACameras+:+%3CTHE+CAMERAS+I+WANT%3E%0APYRAMIDS+:+%3CTHE+PYRAMIDS+I+WANT%3E%0APYRAMIDS+LEVELS:+%3CTHE+PYRAMIDS+LEVELS+I+WANT%3E%0A%0AThanks';

export const DEFAULT_CAMERA = 'main';

export const DEFAULT_EXPOSURE = 'IMG1';

export const DEFAULT_PYRAMID = 'ltm';

export const RUN_CLIPS_SAMPLE_TIMEOUT: number = 10 * 60 * 1000;

export const EXPOSURE_TOOLTIP = 'the offset frame in the GFI';

export const PYRAMID_TOOLTIP = 'the type of the image';

export const PYRAMID_LEVEL_TOOLTIP = 'the resolution of the image';

export const PYRAMID_LEVEL_DEFAULT = 0;
