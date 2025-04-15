import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {getElementBySelector, getElementsBySelector} from '../../testing/utils';
import {MeStepperMenuComponent} from './stepper-menu.component';
import {MeStepperMenuItem, MeStepperMenuStatusEnum} from './stepper-menu-entites';

const menus: MeStepperMenuItem[] = [
  {
    title: 'First',
    status: MeStepperMenuStatusEnum.DONE,
    id: '1',
  },
  {
    title: 'Two',
    status: MeStepperMenuStatusEnum.FAILED,
    id: '2',
  },
  {
    title: 'Three',
    status: MeStepperMenuStatusEnum.IN_PROGRESS,
    id: '3',
  },
  {
    title: 'Four',
    status: MeStepperMenuStatusEnum.NOT_STARTED,
    id: '4',
  },
];

describe('MeStepperMenuComponent', () => {
  let spectator: Spectator<MeStepperMenuComponent>;

  const createComponent = createComponentFactory({
    component: MeStepperMenuComponent,
    imports: [MatIconModule, MatIconTestingModule],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.component.menus = menus;

    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('empty array', () => {
    spectator.component.menus = [];

    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('menu item classes', () => {
    spectator.component.menus = menus;
    spectator.setInput('selectedId', '3');

    spectator.detectChanges();
    const menuDone = getElementsBySelector(spectator.fixture, '.step-done');
    const menuError = getElementsBySelector(spectator.fixture, '.step-failed');
    const menuInProgress = getElementsBySelector(spectator.fixture, '.step-in-progress');
    const menuNotStarted = getElementsBySelector(spectator.fixture, '.step-not-started');
    const selected = getElementsBySelector(spectator.fixture, '.active-menu-item');

    expect(menuDone[0].nativeElement.innerText).toBe('First');
    expect(menuError[0].nativeElement.innerText).toBe('Two');
    expect(menuInProgress[0].nativeElement.innerText).toBe('Three');
    expect(menuNotStarted[0].nativeElement.innerText).toBe('Four');
    expect(selected[0].nativeElement.innerText).toBe('Three');
  });

  it('menu item clicked', () => {
    spectator.component.menus = menus;
    spectator.setInput('selectedId', '3');
    spyOn(spectator.component.menuItemClick, 'emit');

    spectator.detectChanges();

    let selected = getElementsBySelector(spectator.fixture, '.active-menu-item');

    expect(selected[0].nativeElement.innerText).toBe('Three');

    const menuItem = getElementsBySelector(spectator.fixture, '.menu-item');
    menuItem[1].nativeElement.click();
    spectator.setInput('selectedId', menus[1].id);
    spectator.detectChanges();

    selected = getElementsBySelector(spectator.fixture, '.active-menu-item');

    expect(selected[0].nativeElement.innerText).toBe('Two');

    expect(spectator.component.menuItemClick.emit).toHaveBeenCalledTimes(1);
  });

  it('not started menu no clicked fired', () => {
    spectator.component.menus = menus;
    spyOn(spectator.component.menuItemClick, 'emit');

    spectator.detectChanges();

    const menuItem = getElementBySelector(spectator.fixture, '.step-not-started');
    menuItem.nativeElement.click();

    expect(spectator.component.menuItemClick.emit).toHaveBeenCalledTimes(0);
  });

  it('onMenuItemClick click menu item', () => {
    spectator.component.menus = menus;
    spyOn(spectator.component.menuItemClick, 'emit');

    spectator.component.onMenuItemClick(spectator.component.menus[1]);

    expect(spectator.component.menuItemClick.emit).toHaveBeenCalledTimes(1);
  });

  it('onMenuItemClick click not started menu item', () => {
    spectator.component.menus = menus;
    spyOn(spectator.component.menuItemClick, 'emit');

    spectator.component.onMenuItemClick(spectator.component.menus[3]);

    expect(spectator.component.menuItemClick.emit).toHaveBeenCalledTimes(0);
  });
});
