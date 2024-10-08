import {
  Entities,
  Objective,
  ObjectiveType,
  ObjectiveUnit,
  rational,
} from '~/models';
import { StoreUtility } from '~/utilities';
import * as App from '../app.actions';
import * as Items from '../items';
import * as Recipes from '../recipes';
import * as Settings from '../settings';
import { ObjectivesAction, ObjectivesActionType } from './objectives.actions';

export interface ObjectivesState {
  ids: string[];
  entities: Entities<Objective>;
  index: number;
}

export const initialObjectivesState: ObjectivesState = {
  ids: [],
  entities: {},
  index: 0,
};

export function objectivesReducer(
  state: ObjectivesState = initialObjectivesState,
  action:
    | ObjectivesAction
    | App.AppAction
    | Settings.SetModAction
    | Recipes.ResetMachinesAction
    | Recipes.ResetBeaconsAction
    | Items.ResetCheckedAction,
): ObjectivesState {
  switch (action.type) {
    case App.AppActionType.LOAD:
      return action.payload.objectivesState
        ? action.payload.objectivesState
        : initialObjectivesState;
    case App.AppActionType.RESET:
    case Settings.SettingsActionType.SET_MOD:
      return initialObjectivesState;
    case ObjectivesActionType.ADD: {
      let value = rational(1n);
      if (state.ids.length)
        value = state.entities[state.ids[state.ids.length - 1]].value;

      return {
        ...state,
        ...{
          ids: [...state.ids, state.index.toString()],
          entities: {
            ...state.entities,
            ...{
              [state.index]: {
                id: state.index.toString(),
                targetId: action.payload.targetId,
                value,
                unit: action.payload.unit,
                type: action.payload.type ?? ObjectiveType.Output,
              },
            },
          },
          index: state.index + 1,
        },
      };
    }
    case ObjectivesActionType.CREATE: {
      // Use full objective, but enforce id: '0'
      const recipeObjective = { ...action.payload, ...{ id: '0' } };
      return {
        ...state,
        ...{
          ids: [recipeObjective.id],
          entities: { [recipeObjective.id]: recipeObjective },
          index: 1,
        },
      };
    }
    case ObjectivesActionType.REMOVE: {
      const newEntities = { ...state.entities };
      delete newEntities[action.payload];
      return {
        ...state,
        ...{
          ids: state.ids.filter((i) => i !== action.payload),
          entities: newEntities,
        },
      };
    }
    case ObjectivesActionType.SET_ORDER:
      return { ...state, ...{ ids: action.payload } };
    case ObjectivesActionType.SET_TARGET: {
      const entities = StoreUtility.assignValue(
        state.entities,
        'targetId',
        action.payload,
      );
      return {
        ...state,
        ...{
          entities: StoreUtility.resetFields(
            entities,
            ['machineId', 'modules', 'beacons', 'overclock'],
            action.payload.id,
          ),
        },
      };
    }
    case ObjectivesActionType.SET_VALUE:
      return {
        ...state,
        ...{
          entities: StoreUtility.assignValue(
            state.entities,
            'value',
            action.payload,
          ),
        },
      };
    case ObjectivesActionType.SET_UNIT: {
      let entities = StoreUtility.assignValue(state.entities, 'targetId', {
        id: action.payload.id,
        value: action.payload.value.targetId,
      });
      entities = StoreUtility.assignValue(entities, 'unit', {
        id: action.payload.id,
        value: action.payload.value.unit,
      });
      return { ...state, ...{ entities } };
    }
    case ObjectivesActionType.SET_TYPE:
      return {
        ...state,
        ...{
          entities: StoreUtility.assignValue(
            state.entities,
            'type',
            action.payload,
          ),
        },
      };
    case ObjectivesActionType.SET_MACHINE:
      return {
        ...state,
        ...{
          entities: StoreUtility.resetFields(
            StoreUtility.compareReset(
              state.entities,
              'machineId',
              action.payload,
            ),
            ['modules', 'beacons'],
            action.payload.id,
          ),
        },
      };
    case ObjectivesActionType.SET_FUEL:
      return {
        ...state,
        ...{
          entities: StoreUtility.compareReset(
            state.entities,
            'fuelId',
            action.payload,
          ),
        },
      };
    case ObjectivesActionType.SET_MODULES:
      return {
        ...state,
        ...{
          entities: StoreUtility.setValue(
            state.entities,
            'modules',
            action.payload,
          ),
        },
      };
    case ObjectivesActionType.SET_BEACONS:
      return {
        ...state,
        ...{
          entities: StoreUtility.setValue(
            state.entities,
            'beacons',
            action.payload,
          ),
        },
      };
    case ObjectivesActionType.SET_OVERCLOCK:
      return {
        ...state,
        ...{
          entities: StoreUtility.compareReset(
            state.entities,
            'overclock',
            action.payload,
          ),
        },
      };
    case ObjectivesActionType.SET_CHECKED:
      return {
        ...state,
        ...{
          entities: StoreUtility.compareReset(state.entities, 'checked', {
            id: action.payload.id,
            value: action.payload.value,
            def: false,
          }),
        },
      };
    case ObjectivesActionType.RESET_OBJECTIVE:
      return {
        ...state,
        ...{
          entities: StoreUtility.resetFields(
            state.entities,
            ['machineId', 'overclock', 'modules', 'beacons'],
            action.payload,
          ),
        },
      };
    case ObjectivesActionType.ADJUST_DISPLAY_RATE: {
      const newEntities = { ...state.entities };
      for (const objective of state.ids
        .map((i) => state.entities[i])
        .filter(
          (o) =>
            o.type !== ObjectiveType.Maximize &&
            (o.unit === ObjectiveUnit.Items || o.unit === ObjectiveUnit.Wagons),
        )) {
        const value = objective.value.mul(action.payload);
        newEntities[objective.id] = { ...objective, value };
      }
      return {
        ...state,
        ...{ entities: newEntities },
      };
    }
    case Recipes.RecipesActionType.RESET_MACHINES:
      return {
        ...state,
        ...{
          entities: StoreUtility.resetFields(state.entities, [
            'machineId',
            'overclock',
            'modules',
            'beacons',
          ]),
        },
      };
    case Recipes.RecipesActionType.RESET_BEACONS:
      return {
        ...state,
        ...{
          entities: StoreUtility.resetField(state.entities, 'beacons'),
        },
      };
    case Items.ItemsActionType.RESET_CHECKED:
      return {
        ...state,
        ...{
          entities: StoreUtility.resetField(state.entities, 'checked'),
        },
      };
    default:
      return state;
  }
}
