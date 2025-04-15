import {FormControl, NgControl} from '@angular/forms';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DatasourceTablesControlComponent} from 'deep-ui/shared/components/src/lib/controls/datasource-tables-control/datasource-tables-control.component';
import {SelectDatasourceComponent} from 'deep-ui/shared/components/src/lib/selection/select-datasource';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceDeselectData} from 'deep-ui/shared/models';

import createSpy = jasmine.createSpy;
import {DatasourceTablesControlService} from './datasource-tables-control.service';

describe('DatasourceTablesControlComponent', () => {
  let spectator: Spectator<DatasourceTablesControlComponent>;
  const mockControl = new FormControl<any>([]);

  const createComponent = createComponentFactory({
    component: DatasourceTablesControlComponent,
    imports: [SelectDatasourceComponent],
    componentProviders: [{provide: NgControl, useValue: {control: mockControl}}],
    providers: [DatasourceTablesControlService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should initialize control value in ngOnInit', () => {
    spectator.detectChanges();

    expect(spectator.component.control).toEqual(mockControl);
  });

  it('should write value to component', () => {
    spectator.detectChanges();
    const controlValue = [
      {type: DataSourceDynamicViewEnum.PERFECTS, dataSource: {id: '1', name: 'DataSource1'}},
    ];
    spectator.component.writeValue(controlValue);

    expect(spectator.component['_value']).toEqual(controlValue);
  });

  it('should register onChange function', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    spectator.component.registerOnChange(onChangeSpy);

    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it('should register onTouched function', () => {
    const onTouchedSpy = jasmine.createSpy('onTouched');
    spectator.component.registerOnTouched(onTouchedSpy);

    expect(onTouchedSpy).not.toHaveBeenCalled();
  });

  it('should validate control', () => {
    const control = jasmine.createSpyObj('AbstractControl', ['setValue']);
    control.value = [];

    expect(spectator.component.validate(control)).toEqual({required: true});

    control.value = [
      {type: DataSourceDynamicViewEnum.PERFECTS, dataSource: {id: '1', name: 'DataSource1'}},
    ];

    expect(spectator.component.validate(control)).toBeNull();
  });

  it('should handle datasource selections changed', () => {
    const onChange = createSpy('onChange');
    spectator.component.registerOnChange(onChange);
    spectator.detectChanges();

    const selections: any = [
      {type: DataSourceDynamicViewEnum.PERFECTS, dataSource: {id: '1', name: 'DataSource1'}},
    ];
    spectator.component.onDataSourceSelectionsChanged({
      selections: selections,
      type: DataSourceDynamicViewEnum.PERFECTS,
    });
    spectator.detectChanges();

    expect(spectator.component._onChange).toHaveBeenCalledWith(selections);
  });

  it('should handle selection removed', () => {
    const controlValue = [
      {type: DataSourceDynamicViewEnum.PERFECTS, dataSource: {id: '1', name: 'DataSource1'}},
    ];
    spectator.component.ngControl.control.setValue(controlValue);
    const onChange = createSpy('onChange');
    spectator.component.registerOnChange(onChange);
    spectator.detectChanges();

    const removedChipData: DatasourceDeselectData = {
      id: '1',
      level: 0,
      type: DataSourceDynamicViewEnum.PERFECTS,
    };

    spectator.component.onSelectionRemoved(removedChipData);
    spectator.detectChanges();

    expect(spectator.component._onChange).toHaveBeenCalledWith([]);
  });
});
