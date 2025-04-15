import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {EtlModelInferenceFormService} from './etl-model-inference-form.service';

describe('EtlModelInferenceFormService', () => {
  let spectator: SpectatorService<EtlModelInferenceFormService>;
  let service: EtlModelInferenceFormService;

  const createService = createServiceFactory({
    service: EtlModelInferenceFormService,
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(EtlModelInferenceFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
