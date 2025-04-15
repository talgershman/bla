import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MsalService} from '@azure/msal-angular';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';

@Component({
  selector: 'de-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, NgOptimizedImage],
})
export class LoginComponent implements OnInit {
  private authService = inject(MsalService);
  private fullStory = inject(FullStoryService);

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'login'});
  }

  login(): void {
    this.authService.loginRedirect();
  }
}
