import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ActivatedRoute} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {
  BaseCreateEditClipListDirective,
  BaseTourComponent,
} from 'deep-ui/shared/components/src/lib/common';
import {ClipListService} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';

import {ClipListFormComponent} from '../../forms/clip-list-form/clip-list-form.component';
import {breadcrumbs} from './create-clip-list-entities';

@Component({
  selector: 'de-create-clip-list',
  templateUrl: './create-clip-list.component.html',
  styleUrls: ['./create-clip-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BaseTourComponent],
  imports: [MeBreadcrumbsComponent, ClipListFormComponent, MatFormFieldModule],
})
export class CreateClipListComponent extends BaseCreateEditClipListDirective implements OnInit {
  breadcrumbs = breadcrumbs;

  public baseTour = inject(BaseTourComponent);
  private activatedRoute = inject(ActivatedRoute);
  private fullStory = inject(FullStoryService);
  private clipListService = inject(ClipListService);

  clipList: ClipList = this.activatedRoute.snapshot.data.viewData?.clipList;

  file: File = this.activatedRoute.snapshot.data.viewData?.file;

  formMode: 'create' | 'createFromId';

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'create-clip-list'});
    this.formMode = this.clipList?.id && this.file ? 'createFromId' : 'create';
  }

  onClipListFormChanged(clipList: ClipList): void {
    this.submitRequest(clipList, (params: any) => this.clipListService.create(clipList, params));
  }

  onBackButtonPressed(): void {
    this.router.navigate(['./manage/clip-lists']);
  }
}
