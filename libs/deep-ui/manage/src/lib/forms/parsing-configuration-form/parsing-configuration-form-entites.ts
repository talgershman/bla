export const jsonExample1 = {
  itrk: {
    MetaData: {
      MetaData: ['camPort', 'firstFrame', 'horizonFull', 'absoluteFrameId', 'defaultGrabIndex'],
    },
    PrepSys: {
      PyramidL0: ['PyramidL0', 'camPort', 'pyramidType:int64', 'left', 'right', 't0GrabIndex'],
    },
    AVSensingState: {
      rawVDMatching: ['camPort', 'id', 'public_id', 't0GrabIndex'],
    },
  },
  pext: {
    FPA_frame_data: ['defaultGrabIndex', 'egoSpeed'],
    FPA_meta_data: ['cam', 'camPort', 'yaw', 'horizon', 'cameraHeight', 'bumperDist'],
    FPA_Peds_Cluster: '*',
    avNewKalmanWheels: [
      'globalFrameIndex',
      'T0grabIdx',
      'T0FrameIdx',
      'expID',
      'camInst',
      'id',
      'timestamp',
      'wheelId',
      'wheelRect',
    ],
  },
};

export const jsonExample2 = {
  itrk: {
    FID: {
      META_DATA: ['roi_left', 'roi_right', 'roi_bottom', 'roi_top'],
      FULL_IMAGE: [
        'camPort',
        'id',
        'public_id',
        'BBCncMean',
        'BoxCncMean',
        'BBActivePixelsRatio',
        'BoxActivePixelsRatio',
        'ClusteringWeight',
        'ClusteringScore',
        'BoxNumOfPixels',
        'orientation',
        'OrientationAgreement',
        'type',
        'isCar',
        'isTruck',
      ],
      FULL_IMAGE_PIXEL: '*',
    },
    'extra-files': ['*features*'],
  },
};

export const jsonExample3 = {
  itrk: {
    FID: {
      FULL_IMAGE: [
        'camPort:int32',
        'id:int32',
        'public_id:int32',
        'BBCncMean:float32',
        'BoxCncMean:float32',
        'BBActivePixelsRatio:float32',
        'BoxActivePixelsRatio:float32',
        'ClusteringWeight:int32',
        'ClusteringScore:float32',
        'BoxNumOfPixels:int32',
        'orientation:int32',
        'OrientationAgreement:float32',
        'type:int32',
        'isCar:float32',
        'isTruck:float32',
        'isBike:int32',
        'isTrailer:int32',
        'isTrailerConf:int32',
        'killBBReason:int32',
        'killBoxReason:int32',
      ],
    },
  },
};

export const jsonExample4 = {
  itrk: {
    FID: {
      FULL_IMAGE: ['camPort:int32', 'public_id:int32'],
    },
  },
  settings: {
    data_types_from_itrk: true,
  },
};
