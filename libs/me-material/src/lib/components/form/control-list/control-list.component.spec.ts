import {MeControlErrorMsgComponent} from '@mobileye/material/src/lib/components/form/control-error-msg';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list/control-list.component';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

describe('MeControlListComponent', () => {
  let spectator: Spectator<MeControlListComponent>;

  const createComponent = createComponentFactory({
    component: MeControlListComponent,
    imports: [MeControlErrorMsgComponent],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
