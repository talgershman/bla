import {DomSanitizer} from '@angular/platform-browser';

import {MeSafePipe} from './safe.pipe';

describe('MeSafePipe', () => {
  it('create an instance', () => {
    const pipe = new MeSafePipe({} as DomSanitizer);

    expect(pipe).toBeTruthy();
  });
});
