import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'meClock',
})
export class MeClockPipe implements PipeTransform {
  // eslint-disable-next-line
  transform(value: number, ...args: any[]): unknown {
    const hours = Math.floor(value / 60 / 60);
    const minutes = Math.floor(value / 60) % 60;
    const seconds = value % 60;
    return `${this._padding(hours)}${hours} : ${this._padding(minutes)}${minutes} : ${this._padding(
      seconds,
    )}${seconds}`;
  }

  private _padding(time): string {
    return time < 10 ? '0' : '';
  }
}
