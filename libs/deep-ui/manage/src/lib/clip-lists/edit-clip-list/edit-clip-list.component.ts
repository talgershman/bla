import {Component, inject, OnInit} from '@angular/core';
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
import {getBreadcrumbs} from './edit-clip-list-entities';

@Component({
  selector: 'de-edit-clip-list',
  templateUrl: './edit-clip-list.component.html',
  styleUrls: ['./edit-clip-list.component.scss'],
  hostDirectives: [BaseTourComponent],
  imports: [MeBreadcrumbsComponent, ClipListFormComponent, MatFormFieldModule],
})
export class EditClipListComponent extends BaseCreateEditClipListDirective implements OnInit {
  public baseTour = inject(BaseTourComponent);
  private fullStory = inject(FullStoryService);
  private activatedRoute = inject(ActivatedRoute);
  private clipListService = inject(ClipListService);

  clipList: ClipList = this.activatedRoute.snapshot.data.clipList as ClipList;

  breadcrumbs = getBreadcrumbs(this.clipList);

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'edit-clip-list'});
  }

  onClipListFormChanged(clipList: ClipList): void {
    this.submitRequest(clipList, (params: any) =>
      this.clipListService.update(this.clipList.id, clipList, params),
    );
  }
}
