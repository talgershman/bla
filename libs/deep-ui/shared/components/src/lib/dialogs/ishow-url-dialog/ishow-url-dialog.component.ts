import {ChangeDetectionStrategy, Component, inject, Input, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import copy from 'copy-to-clipboard';

@Component({
  selector: 'de-ishow-url-dialog',
  templateUrl: './ishow-url-dialog.component.html',
  styleUrls: ['./ishow-url-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatDialogModule, MeTextareaComponent, FormsModule],
})
export class IshowUrlDialogComponent implements OnInit {
  @Input()
  ishowUrl: string;

  shortUrl: string;

  private snackbar = inject(MeSnackbarService);

  ngOnInit(): void {
    this._calculateShortUrl();
  }

  copyToClipboard(ishowUrl: string): void {
    copy(ishowUrl);
    this.snackbar.onCopyToClipboard();
  }

  private _calculateShortUrl(): void {
    if (!this.ishowUrl) {
      return;
    }
    const firstQuestionMarkIndex = this.ishowUrl?.indexOf('?');
    if (firstQuestionMarkIndex !== -1) {
      this.shortUrl = this.ishowUrl.slice(0, firstQuestionMarkIndex);
    }
  }
}
