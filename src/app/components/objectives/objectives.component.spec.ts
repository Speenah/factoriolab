import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';

import { DispatchTest, ItemId, Mocks, RecipeId, TestModule } from 'src/tests';
import { AppSharedModule } from '~/app-shared.module';
import { MatrixResultType, ObjectiveType, ObjectiveUnit } from '~/models';
import { LabState, Objectives, Settings } from '~/store';
import { ObjectivesComponent } from './objectives.component';

describe('ObjectivesComponent', () => {
  let component: ObjectivesComponent;
  let fixture: ComponentFixture<ObjectivesComponent>;
  let mockStore: MockStore<LabState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ObjectivesComponent],
      imports: [AppSharedModule, TestModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectivesComponent);
    mockStore = TestBed.inject(MockStore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getMessages', () => {
    it('should build an error message to display to the user', () => {
      const result = component.getMessages({
        steps: [],
        resultType: MatrixResultType.Failed,
      });
      expect(result.length).toEqual(1);
    });

    it('should build specific error messages to display to the user', () => {
      let result = component.getMessages({
        steps: [],
        resultType: MatrixResultType.Failed,
        simplexStatus: 'unbounded',
      });
      expect(result[0].summary).toEqual('objectives.errorUnbounded');

      result = component.getMessages({
        steps: [],
        resultType: MatrixResultType.Failed,
        simplexStatus: 'no_feasible',
      });
      expect(result[0].summary).toEqual('objectives.errorInfeasible');
    });
  });

  describe('changeUnit', () => {
    it('should do nothing if switching to and from machines', () => {
      spyOn(component, 'setUnit');
      component.changeUnit(
        Mocks.Objective5,
        ObjectiveUnit.Machines,
        Mocks.Dataset
      );
      expect(component.setUnit).not.toHaveBeenCalled();
    });

    it('should auto-switch from item to recipe', () => {
      spyOn(component, 'setUnit');
      component.changeUnit(
        Mocks.Objective1,
        ObjectiveUnit.Machines,
        Mocks.Dataset
      );
      expect(component.setUnit).toHaveBeenCalledWith(Mocks.Objective1.id, {
        targetId: RecipeId.AdvancedCircuit,
        unit: ObjectiveUnit.Machines,
      });
    });

    it('should prompt user to switch from item to recipe', () => {
      spyOn(component, 'setUnit');
      spyOn(component.chooseRecipePicker!, 'clickOpen').and.callFake(() =>
        component.chooseRecipePicker!.selectId.next('id')
      );
      component.changeUnit(
        {
          id: '0',
          targetId: ItemId.PetroleumGas,
          value: '1',
          unit: ObjectiveUnit.Items,
          type: ObjectiveType.Output,
        },
        ObjectiveUnit.Machines,
        Mocks.Dataset
      );
      expect(component.setUnit).toHaveBeenCalledWith('0', {
        targetId: 'id',
        unit: ObjectiveUnit.Machines,
      });
    });

    it('should throw if recipe picker is not found', () => {
      component.chooseRecipePicker = undefined;
      expect(() =>
        component.changeUnit(
          {
            id: '0',
            targetId: ItemId.PetroleumGas,
            value: '1',
            unit: ObjectiveUnit.Items,
            type: ObjectiveType.Output,
          },
          ObjectiveUnit.Machines,
          Mocks.Dataset
        )
      ).toThrow();
    });

    it('should auto-switch from recipe to item', () => {
      spyOn(component, 'setUnit');
      component.changeUnit(
        Mocks.Objective5,
        ObjectiveUnit.Items,
        Mocks.Dataset
      );
      expect(component.setUnit).toHaveBeenCalledWith(Mocks.Objective5.id, {
        targetId: ItemId.PiercingRoundsMagazine,
        unit: ObjectiveUnit.Items,
      });
    });

    it('should prompt user to switch from recipe to item', () => {
      spyOn(component, 'setUnit');
      spyOn(component.chooseItemPicker!, 'clickOpen').and.callFake(() =>
        component.chooseItemPicker!.selectId.next('id')
      );
      component.changeUnit(
        {
          id: '0',
          targetId: RecipeId.AdvancedOilProcessing,
          value: '1',
          unit: ObjectiveUnit.Machines,
          type: ObjectiveType.Output,
        },
        ObjectiveUnit.Items,
        Mocks.Dataset
      );
      expect(component.setUnit).toHaveBeenCalledWith('0', {
        targetId: 'id',
        unit: ObjectiveUnit.Items,
      });
    });

    it('should throw if item picker is not found', () => {
      component.chooseItemPicker = undefined;
      expect(() =>
        component.changeUnit(
          {
            id: '0',
            targetId: RecipeId.AdvancedOilProcessing,
            value: '1',
            unit: ObjectiveUnit.Machines,
            type: ObjectiveType.Output,
          },
          ObjectiveUnit.Items,
          Mocks.Dataset
        )
      ).toThrow();
    });

    it('should auto-switch between items rate units', () => {
      spyOn(component, 'setUnit');
      component.changeUnit(
        Mocks.Objective1,
        ObjectiveUnit.Belts,
        Mocks.Dataset
      );
      expect(component.setUnit).toHaveBeenCalledWith(Mocks.Objective1.id, {
        targetId: Mocks.Objective1.targetId,
        unit: ObjectiveUnit.Belts,
      });
    });
  });

  describe('addItemObjective', () => {
    it('should use ObjectiveUnit.Items', () => {
      spyOn(component, 'addObjective');
      component.addItemObjective(ItemId.AdvancedCircuit);
      expect(component.addObjective).toHaveBeenCalledWith({
        targetId: ItemId.AdvancedCircuit,
        unit: ObjectiveUnit.Items,
      });
    });
  });

  describe('addRecipeObjective', () => {
    it('should use ObjectiveUnit.Machines', () => {
      spyOn(component, 'addObjective');
      component.addRecipeObjective(RecipeId.AdvancedCircuit);
      expect(component.addObjective).toHaveBeenCalledWith({
        targetId: RecipeId.AdvancedCircuit,
        unit: ObjectiveUnit.Machines,
      });
    });
  });

  it('should dispatch actions', () => {
    const dispatch = new DispatchTest(mockStore, component);
    dispatch.val('removeObjective', Objectives.RemoveAction);
    dispatch.val('raiseObjective', Objectives.RaiseAction);
    dispatch.val('lowerObjective', Objectives.LowerAction);
    dispatch.idVal('setTarget', Objectives.SetTargetAction);
    dispatch.idVal('setValue', Objectives.SetValueAction);
    dispatch.idVal('setUnit', Objectives.SetUnitAction);
    dispatch.idVal('setType', Objectives.SetTypeAction);
    dispatch.val('addObjective', Objectives.AddAction);
    dispatch.valPrev('setDisplayRate', Settings.SetDisplayRateAction);
  });
});
