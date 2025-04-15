import {NgClass, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  input,
  Output,
  Signal,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

import {MeStepperMenuItem, MeStepperMenuStatusEnum} from './stepper-menu-entites';

@Component({
  selector: 'me-stepper-menu',
  templateUrl: './stepper-menu.component.html',
  styleUrls: ['./stepper-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgTemplateOutlet, MatIconModule],
})
export class MeStepperMenuComponent {
  @Input()
  menus: MeStepperMenuItem[];

  selectedId = input<string>();

  @Output()
  menuItemClick = new EventEmitter<MeStepperMenuItem>();

  activeMenu: Signal<MeStepperMenuItem> = computed(() => {
    return this.menus.find((menu: MeStepperMenuItem) => menu.id === this.selectedId());
  });

  MeStepperMenuStatusEnum = MeStepperMenuStatusEnum;

  onMenuItemClick(menu: MeStepperMenuItem): void {
    if (menu.status !== MeStepperMenuStatusEnum.NOT_STARTED) {
      this.menuItemClick.emit(menu);
    }
  }
}
