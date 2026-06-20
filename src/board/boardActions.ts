import { BoardState, Stroke } from "./boardTypes";

export function addStroke(state: BoardState, stroke: Stroke): BoardState {
  return {
    ...state,
    columns: state.columns.map((col) =>
      col.id === stroke.columnId
        ? { ...col, strokes: [...col.strokes, stroke] }
        : col
    ),
  };
}

export function eraseStrokes(
  state: BoardState,
  columnId: string,
  strokeIds: string[]
): BoardState {
  if (strokeIds.length === 0) return state;
  const idSet = new Set(strokeIds);
  return {
    ...state,
    columns: state.columns.map((col) =>
      col.id === columnId
        ? { ...col, strokes: col.strokes.filter((s) => !idSet.has(s.id)) }
        : col
    ),
  };
}

export function undoLastStroke(state: BoardState): BoardState {
  const activeCol = state.columns.find((c) => c.id === state.activeColumnId);
  if (!activeCol || activeCol.strokes.length === 0) return state;
  return {
    ...state,
    columns: state.columns.map((col) =>
      col.id === state.activeColumnId
        ? { ...col, strokes: col.strokes.slice(0, -1) }
        : col
    ),
  };
}

export function clearActiveColumn(state: BoardState): BoardState {
  return {
    ...state,
    columns: state.columns.map((col) =>
      col.id === state.activeColumnId ? { ...col, strokes: [] } : col
    ),
  };
}

export function clearWholeBoard(state: BoardState): BoardState {
  return {
    ...state,
    columns: state.columns.map((col) => ({ ...col, strokes: [] })),
  };
}

export function nextColumn(state: BoardState): BoardState {
  const idx = state.columns.findIndex((c) => c.id === state.activeColumnId);
  const nextIdx = (idx + 1) % state.columns.length;
  return { ...state, activeColumnId: state.columns[nextIdx].id };
}

export function previousColumn(state: BoardState): BoardState {
  const idx = state.columns.findIndex((c) => c.id === state.activeColumnId);
  const prevIdx = (idx - 1 + state.columns.length) % state.columns.length;
  return { ...state, activeColumnId: state.columns[prevIdx].id };
}

export function addColumn(state: BoardState): BoardState {
  const newId = `col-${Date.now()}`;
  return {
    ...state,
    columns: [...state.columns, { id: newId, strokes: [] }],
  };
}

export function removeColumn(state: BoardState): BoardState {
  if (state.columns.length <= 1) return state;
  const idx = state.columns.findIndex((c) => c.id === state.activeColumnId);
  const newColumns = state.columns.filter((c) => c.id !== state.activeColumnId);
  const newActiveIdx = Math.min(idx, newColumns.length - 1);
  return {
    ...state,
    columns: newColumns,
    activeColumnId: newColumns[newActiveIdx].id,
  };
}

export function applyBoardEvent(
  state: BoardState,
  event: import("./boardTypes").BoardEvent,
  seenEventIds: Set<string>
): { state: BoardState; seenEventIds: Set<string> } {
  if (seenEventIds.has(event.eventId)) {
    return { state, seenEventIds };
  }
  const newSeen = new Set(seenEventIds);
  newSeen.add(event.eventId);

  let newState = state;
  switch (event.type) {
    case "strokeCommitted": {
      const { stroke } = event.payload as { stroke: Stroke };
      if (
        stroke &&
        stroke.columnId &&
        state.columns.some((c) => c.id === stroke.columnId)
      ) {
        newState = addStroke(state, stroke);
      }
      break;
    }
    case "eraseStrokes": {
      const { columnId, strokeIds } = event.payload as {
        columnId: string;
        strokeIds: string[];
      };
      if (columnId && Array.isArray(strokeIds)) {
        newState = eraseStrokes(state, columnId, strokeIds);
      }
      break;
    }
    case "undo":
      newState = undoLastStroke(state);
      break;
    case "clearActiveColumn":
      newState = clearActiveColumn(state);
      break;
    case "clearWholeBoard":
      newState = clearWholeBoard(state);
      break;
    case "nextColumn":
      newState = nextColumn(state);
      break;
    case "previousColumn":
      newState = previousColumn(state);
      break;
    case "addColumn":
      newState = addColumn(state);
      break;
    case "removeColumn":
      newState = removeColumn(state);
      break;
    case "snapshotResponse": {
      const { boardState, seq: _seq } = event.payload as {
        boardState: BoardState;
        seq: number;
      };
      if (boardState) {
        newState = boardState;
      }
      break;
    }
    default:
      break;
  }

  return { state: newState, seenEventIds: newSeen };
}
