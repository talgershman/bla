import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';

@Component({
  selector: 'de-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent implements OnInit {
  private fullStory = inject(FullStoryService);
  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'not-found'});
  }
}
