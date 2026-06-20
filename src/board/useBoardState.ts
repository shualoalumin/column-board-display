import { useCallback, useReducer } from "react";
import {
  BoardState,
  Stroke,
  createDefaultBoardState,
} from "./boardTypes";
import * as actions from "./boardActions";

type BoardReducerAction =
  | { type: "ADD_STROKE"; stroke: Stroke }
  | { type: "UNDO" }
  | { type: "CLEAR_ACTIVE_COLUMN" }
  | { type: "CLEAR_WHOLE_BOARD" }
  | { type: "NEXT_COLUMN" }
  | { type: "PREVIOUS_COLUMN" }
  | { type: "ADD_COLUMN" }
  | { type: "REMOVE_COLUMN" }
  | { type: "SET_STATE"; state: BoardState };

function boardReducer(state: BoardState, action: BoardReducerAction): BoardState {
  switch (action.type) {
    case "ADD_STROKE": return actions.addStroke(state, action.stroke);
    case "UNDO": return actions.undoLastStroke(state);
    case "CLEAR_ACTIVE_COLUMN": return actions.clearActiveColumn(state);
    case "CLEAR_WHOLE_BOARD": return actions.clearWholeBoard(state);
    case "NEXT_COLUMN": return actions.nextColumn(state);
    case "PREVIOUS_COLUMN": return actions.previousColumn(state);
    case "ADD_COLUMN": return actions.addColumn(state);
    case "REMOVE_COLUMN": return actions.removeColumn(state);
    case "SET_STATE": return action.state;
    default: return state;
  }
}

export function useBoardState(initialState?: BoardState) {
  const [boardState, dispatch] = useReducer(
    boardReducer,
    initialState ?? createDefaultBoardState()
  );

  const addStroke = useCallback((stroke: Stroke) =>
    dispatch({ type: "ADD_STROKE", stroke }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const clearActiveColumn = useCallback(() => dispatch({ type: "CLEAR_ACTIVE_COLUMN" }), []);
  const clearWholeBoard = useCallback(() => dispatch({ type: "CLEAR_WHOLE_BOARD" }), []);
  const goNextColumn = useCallback(() => dispatch({ type: "NEXT_COLUMN" }), []);
  const goPreviousColumn = useCallback(() => dispatch({ type: "PREVIOUS_COLUMN" }), []);
  const addColumn = useCallback(() => dispatch({ type: "ADD_COLUMN" }), []);
  const removeColumn = useCallback(() => dispatch({ type: "REMOVE_COLUMN" }), []);
  const setState = useCallback((state: BoardState) =>
    dispatch({ type: "SET_STATE", state }), []);

  return {
    boardState,
    addStroke,
    undo,
    clearActiveColumn,
    clearWholeBoard,
    goNextColumn,
    goPreviousColumn,
    addColumn,
    removeColumn,
    setState,
  };
}
