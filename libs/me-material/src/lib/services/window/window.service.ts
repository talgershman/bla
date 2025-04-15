import {Injectable} from '@angular/core';

@Injectable()
export class MeWindowService {
  get nativeWindow(): Window {
    return window;
  }
}
