import {AfterViewInit, Directive, inject, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject} from 'rxjs';

@Directive({
  selector: '[deBaseTour]',
  providers: [],
})
export class BaseTourComponent implements OnDestroy, AfterViewInit {
  openTour = new Subject<void>();

  openTour$ = this.openTour.asObservable();

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private triggerStartTourOnLoad = this.router.getCurrentNavigation()?.extras?.state?.startTour;

  ngOnDestroy(): void {
    this.openTour.complete();
  }

  handleTourClicked(): void {
    this.openTour.next();
  }
  ngAfterViewInit(): void {
    if (this.activatedRoute.snapshot.data.viewData?.startTour) {
      setTimeout(() => {
        this.openTour.next();
      }, 300);
    }
  }
}
