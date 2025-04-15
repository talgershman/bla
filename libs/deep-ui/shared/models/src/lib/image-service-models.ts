export interface ImageServiceSequenceRequest {
  clip: string;
  exposure: string;
  camera: string;
  pyramid: string;
  pyramid_level?: number;
  jpeg_quality?: number;
}

export interface ImageServiceRenderedImageRequest extends ImageServiceSequenceRequest {
  gfi?: number;
  frame_id?: number;
}
