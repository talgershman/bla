import {ChangeDetectionStrategy, Component, Input, input, OnInit} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatMenuModule} from '@angular/material/menu';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';

import {MeAvatarItem} from './avatar-entities';

@Component({
  selector: 'me-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, MatDividerModule, MatCardModule, MeSafePipe],
})
export class MeAvatarComponent implements OnInit {
  @Input()
  name: string;

  @Input()
  userMenuItems: MeAvatarItem[];

  photo = input<string>('');

  initials: string;

  ngOnInit(): void {
    this._createInitials();
  }

  private _createInitials(): void {
    let initials = '';
    if (!this.name) {
      return;
    }

    for (let i = 0; i < this.name.length; i += 1) {
      if (this.name.charAt(i) === ' ') {
        continue;
      }

      if (this.name.charAt(i) === this.name.charAt(i).toUpperCase()) {
        initials += this.name.charAt(i);

        if (initials && initials.length === 2) {
          break;
        }
      }
    }

    this.initials = initials;
  }
}
