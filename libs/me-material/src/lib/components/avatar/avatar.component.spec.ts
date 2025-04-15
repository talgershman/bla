import {DebugElement} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatMenuModule} from '@angular/material/menu';
import {By} from '@angular/platform-browser';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe/safe.pipe';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAvatarComponent} from './avatar.component';

describe('MeAvatarComponent', () => {
  let spectator: Spectator<MeAvatarComponent>;
  let debugElem: DebugElement;

  const createComponent = createComponentFactory({
    component: MeAvatarComponent,
    imports: [MatMenuModule, MatDividerModule, MatCardModule, MeSafePipe],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    debugElem = spectator.fixture.debugElement;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('createInitials', () => {
    it('empty value', () => {
      spectator.detectChanges();
      const initials = debugElem.query(By.css('.initials')).nativeElement.innerText;

      expect(initials).toMatch('');
    });

    it('one word', () => {
      spectator.component.name = 'One';
      spectator.detectChanges();
      const initials = debugElem.query(By.css('.initials')).nativeElement.innerText;

      expect(initials).toMatch('O');
    });

    it('two words', () => {
      spectator.component.name = 'One Two';
      spectator.detectChanges();
      const initials = debugElem.query(By.css('.initials')).nativeElement.innerText;

      expect(initials).toMatch('OT');
    });

    it('more then two words', () => {
      spectator.component.name = 'One Two Another';
      spectator.detectChanges();
      const initials = debugElem.query(By.css('.initials')).nativeElement.innerText;

      expect(initials).toMatch('OT');
    });
  });
});
