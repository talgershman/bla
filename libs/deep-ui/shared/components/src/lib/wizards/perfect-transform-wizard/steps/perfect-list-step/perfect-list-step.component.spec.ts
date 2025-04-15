//
// import {ReactiveFormsModule} from '@angular/forms';
// import {MatFormFieldModule} from '@angular/material/form-field';
// import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
// import {getElementBySelector, MeAgTableHarness} from '@mobileye/material/src/lib/testing';
// import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
// import {SelectPerfectListComponent} from 'deep-ui/shared/components/src/lib/selection/select-perfect-list';
// import {PerfectListService} from 'deep-ui/shared/core';
// import {getFakePerfectList} from 'deep-ui/shared/testing';
// import {of} from 'rxjs';
//
// import {PerfectListStepComponent} from './perfect-list-step.component';
//
// describe('PerfectListStepComponent', () => {
//   let spectator: Spectator<PerfectListStepComponent>;
//   let perfectListService: SpyObject<PerfectListService>;
//   const createComponent = createComponentFactory({
//     component: PerfectListStepComponent,
//     imports: [
//
//       ReactiveFormsModule,
//       SelectPerfectListComponent,
//       MatFormFieldModule,
//     ],
//     mocks: [MeAzureGraphService, PerfectListService],
//     detectChanges: false,
//   });
//
//   beforeEach(() => {
//     spectator = createComponent();
//     perfectListService = spectator.inject(PerfectListService);
//     perfectListService.getMulti.and.returnValue(
//       of([
//         getFakePerfectList(true, {technology: 'AV', modifiedAt: '2021-03-03T15:27:39.267925+02:00'}),
//         getFakePerfectList(true, {technology: 'AV', modifiedAt: '2021-03-02T15:27:39.267925+02:00'}),
//         getFakePerfectList(true, {technology: 'ROAD', modifiedAt: '2021-03-01T15:27:39.267925+02:00'}),
//       ])
//     );
//   });
//
//   it('should create', () => {
//     spectator.detectChanges();
//
//     expect(spectator.component).toBeTruthy();
//   });
//
//   describe('Select rows', () => {
//     it('mix technologies should show error', async () => {
//       spectator.component.isShown = true;
//
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//
//       await MeAgTableHarness.waitForTable(spectator.fixture);
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//
//       await MeAgTableHarness.clickRow(spectator.fixture, 0);
//       await MeAgTableHarness.clickRow(spectator.fixture, 2);
//
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//
//       const error = getElementBySelector(spectator.fixture, 'mat-error');
//
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//
//       expect(error.nativeElement.innerText).toBe('All Perfect lists must have the same technology');
//     });
//
//     it('same technologies should call next step', async () => {
//       spectator.component.isShown = true;
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//
//       await MeAgTableHarness.waitForTable(spectator.fixture);
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//
//       await MeAgTableHarness.clickRow(spectator.fixture, 0);
//       await MeAgTableHarness.clickRow(spectator.fixture, 1);
//
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//
//       const error = getElementBySelector(spectator.fixture, 'mat-error');
//
//       spectator.detectChanges();
//       await spectator.fixture.whenStable();
//
//       expect(error).toBeNull();
//     });
//   });
// });
