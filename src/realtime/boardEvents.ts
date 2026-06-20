import { BoardEvent, BoardState, NetworkEventType, UserRole } from "../board/boardTypes";

let senderIdCache: string | null = null;

export function getSenderId(): string {
  if (senderIdCache) return senderIdCache;
  const stored = sessionStorage.getItem("column-board:senderId");
  if (stored) {
    senderIdCache = stored;
    return senderIdCache;
  }
  const newId = crypto.randomUUID();
  sessionStorage.setItem("column-board:senderId", newId);
  senderIdCache = newId;
  return senderIdCache;
}

export function createBoardEvent(
  type: NetworkEventType,
  roomId: string,
  boardId: string,
  seq: number,
  senderRole: UserRole,
  payload: unknown
): BoardEvent {
  return {
    eventId: crypto.randomUUID(),
    roomId,
    boardId,
    seq,
    senderId: getSenderId(),
    senderRole,
    type,
    payload,
    sentAt: Date.now(),
  };
}

// Board-mutating event types. Only teacher can send these.
export const BOARD_MUTATING_TYPES: NetworkEventType[] = [
  "strokeCommitted",
  "eraseStrokes",
  "undo",
  "clearActiveColumn",
  "clearWholeBoard",
  "nextColumn",
  "previousColumn",
  "addColumn",
  "removeColumn",
];

export function isBoardMutating(type: NetworkEventType): boolean {
  return BOARD_MUTATING_TYPES.includes(type);
}

// Teacher localStorage backup
export function saveTeacherStateToLocalStorage(
  roomId: string,
  boardState: BoardState,
  seq: number
): void {
  const key = `column-board:${roomId}:teacher-state`;
  localStorage.setItem(key, JSON.stringify({ boardState, seq, updatedAt: Date.now() }));
}

export function loadTeacherStateFromLocalStorage(
  roomId: string
): { boardState: BoardState; seq: number } | null {
  const key = `column-board:${roomId}:teacher-state`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
