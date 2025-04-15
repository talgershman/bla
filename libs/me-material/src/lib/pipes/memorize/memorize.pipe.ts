import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'memorize',
  pure: true,
})
export class MeMemorizePipe implements PipeTransform {
  // eslint-disable-next-line
  transform(fn: Function, ...args: any[]): any {
    return fn(...args);
  }
}
