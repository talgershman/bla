import {animate, state, style, transition, trigger} from '@angular/animations';

export const MeFadeInOutAnimation = trigger('MeFadeInOut', [
  transition(':enter', [style({opacity: 0}), animate('200ms ease-in', style({opacity: 1}))]),
  transition(':leave', [animate('200ms ease-out', style({opacity: 0}))]),
]);

export const MeDynamicFadeInOutAnimation = (delay = 800, name?: string) => {
  return trigger(name || 'MeDynamicFadeInOut', [
    transition(':enter', [style({opacity: 0}), animate(`${delay}ms ease-in`, style({opacity: 1}))]),
    transition(':leave', [animate(`${delay}ms ease-out`, style({opacity: 0}))]),
  ]);
};

export const MeOpacityAnimation = trigger('MeOpacityAnimation', [
  state(
    'show',
    style({
      opacity: 1,
    }),
  ),
  state(
    'hide',
    style({
      opacity: 0,
    }),
  ),
  transition('show => hide', animate('200ms ease-out')),
  transition('hide => show', animate('200ms ease-in')),
]);

export const MeFlipXDownArrowAnimation = trigger('flipX', [
  state(
    'desc',
    style({
      transform: 'rotateX(0deg)',
    }),
  ),
  state(
    'asc',
    style({
      transform: 'rotateX(-180deg)',
    }),
  ),
  transition('desc => asc', [animate('300ms 0s ease-in')]),
  transition('asc => desc', [animate('300ms 0s ease-out')]),
]);
