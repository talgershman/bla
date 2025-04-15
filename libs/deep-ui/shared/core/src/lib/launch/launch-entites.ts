export interface ValidateDataSetErrorResponse {
  error?: string;
  invalidClips?: string[];
}

export interface ValidateDatasetResponse extends ValidateDataSetErrorResponse {
  s3Path?: string;
  clipsToParamsHashPath?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface UploadClip2logFilterListResponse extends ValidateDataSetErrorResponse {
  s3Path?: string;
}

export enum LogsDirFilterType {
  NO_FILTER = 'no_filter',
  FILTER_BY_FILE = 'filter_by_file',
  FILTER_BY_CLIP_LIST = 'filter_by_clip_list',
}
