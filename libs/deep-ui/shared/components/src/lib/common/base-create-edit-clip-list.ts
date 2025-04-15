import {ChangeDetectorRef, Directive, inject} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ClipListValidationResponse} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';

@UntilDestroy()
@Directive()
export class BaseCreateEditClipListDirective {
  clipList: ClipList;

  errorMsg: string;

  invalidClips: string[];

  protected loadingService = inject(MeLoadingService);
  protected dialog = inject(MatDialog);
  protected cd = inject(ChangeDetectorRef);
  protected router = inject(Router);

  submitRequest(clipList: ClipList, clipListServiceCallback: Function): void {
    if (clipList) {
      this.loadingService.showLoader();
      clipListServiceCallback()
        .pipe(
          catchError((response) =>
            of({
              error: getErrorHtmlMsgFromResponse(response, false, true),
            }),
          ),
          finalize(() => this.loadingService.hideLoader()),
        )
        .subscribe((response: any) => {
          if (response && 'overrideDataKey' in response) {
            this.onOverride(clipList, response, clipListServiceCallback);
          } else {
            this.onResponseReceived(response);
          }
        });
    } else {
      this.onBackButtonPressed();
    }
  }

  onResponseReceived(response: any, clipList?: ClipList): void {
    if (response?.error) {
      const errorObj = response.error ? response.error : response;
      this.errorMsg = errorObj.error || errorObj;
      this.invalidClips = errorObj.invalidClips ? errorObj.invalidClips : [];
      this.cd.detectChanges();
    } else {
      this.onBackButtonPressed(clipList || response);
    }
  }

  onOverride(
    clipList: ClipList,
    validationResponse: ClipListValidationResponse,
    callback: Function,
  ): void {
    const dialogRef = this.dialog.open(MeAreYouSureDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      width: '31.5rem',
      maxHeight: '25rem',
      panelClass: 'dialog-clip-list-override',
    });
    dialogRef.componentInstance.title = 'Confirm Action';
    dialogRef.componentInstance.contentHtml = `<div>
    Are you sure you want to <b>override</b> the following playlists?<ol><li>${validationResponse.overrideList.join(
      '</li><li>',
    )}</li></ol>
    If not, please remove them from your clip list and try again.</div>`;
    dialogRef.componentInstance.cancelPlaceHolder = `Cancel`;
    dialogRef.componentInstance.confirmPlaceHolder = `Override`;
    dialogRef.componentInstance.confirmed
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onOverrideConfirmed(clipList, validationResponse, callback));
  }

  onOverrideConfirmed(
    clipList: ClipList,
    validationResponse: ClipListValidationResponse,
    callback: Function,
  ): void {
    callback({overrideDataKey: validationResponse.overrideDataKey})
      .pipe(catchError((response) => of(response)))
      .subscribe((response: any) => this.onResponseReceived(response, clipList));
  }

  onBackButtonPressed(clipList?: ClipList): void {
    this.router.navigate(['./manage/clip-lists'], {
      state: {selected: clipList || this.clipList},
    });
  }
}
