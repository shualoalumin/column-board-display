export type Tool = "pen" | "eraser";
export type InputMode = "auto" | "penOnly" | "touchMouse";
export type UserRole = "teacher" | "display" | "viewer";

export interface Point {
  x: number;          // logical coordinate (0..logicalWidth)
  y: number;          // logical coordinate (0..logicalHeight)
  pressure?: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  columnId: string;
  tool: Tool;
  color: string;
  width: number;      // logical units, NOT css px
  points: Point[];
}

export interface Column {
  id: string;
  strokes: Stroke[];
}

export interface BoardState {
  logicalWidth: number;
  logicalHeight: number;
  columns: Column[];
  activeColumnId: string;
}

export type BoardAction =
  | { type: "addStroke"; strokeId: string; columnId: string }
  | { type: "eraseStroke"; strokeId: string; columnId: string }
  | { type: "clearActiveColumn"; columnId: string; previousStrokes: Stroke[] }
  | { type: "clearWholeBoard"; previousColumns: Column[] }
  | { type: "nextColumn"; from: string; to: string }
  | { type: "previousColumn"; from: string; to: string };

// Future network event model (not implemented in Phase 0)
export type NetworkEventType =
  | "strokeCommitted"
  | "undo"
  | "clearActiveColumn"
  | "clearWholeBoard"
  | "nextColumn"
  | "previousColumn"
  | "addColumn"
  | "removeColumn"
  | "snapshotRequest"
  | "snapshotResponse"
  | "teacherHeartbeat";

export interface BoardEvent {
  eventId: string;
  roomId: string;
  boardId: string;
  seq: number;
  senderId: string;
  senderRole: UserRole;
  type: NetworkEventType;
  payload: unknown;
  sentAt: number;
}

export const LOGICAL_WIDTH = 1000;
export const LOGICAL_HEIGHT = 1800;
export const MIN_COLUMN_WIDTH = 420; // CSS px

export function createDefaultBoardState(): BoardState {
  return {
    logicalWidth: LOGICAL_WIDTH,
    logicalHeight: LOGICAL_HEIGHT,
    columns: [
      { id: "col-1", strokes: [] },
      { id: "col-2", strokes: [] },
      { id: "col-3", strokes: [] },
    ],
    activeColumnId: "col-1",
  };
}
