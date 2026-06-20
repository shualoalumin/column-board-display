import { BoardEvent, BoardState } from "../board/boardTypes";
import { applyBoardEvent } from "../board/boardActions";
import { isBoardMutating } from "./boardEvents";

export interface RealtimeState {
  boardState: BoardState;
  lastAppliedSeq: number;
  seenEventIds: Set<string>;
}

export function applyEventToRealtimeState(
  rs: RealtimeState,
  event: BoardEvent
): RealtimeState {
  // Ignore board-mutating events from non-teacher roles
  if (isBoardMutating(event.type) && event.senderRole !== "teacher") {
    return rs;
  }

  // Handle snapshotResponse specially: replace entire board state
  if (event.type === "snapshotResponse") {
    if (rs.seenEventIds.has(event.eventId)) return rs;
    const payload = event.payload as { boardState: BoardState; seq: number };
    const newSeen = new Set(rs.seenEventIds);
    newSeen.add(event.eventId);
    return {
      boardState: payload.boardState,
      lastAppliedSeq: payload.seq,
      seenEventIds: newSeen,
    };
  }

  // For board-mutating events: check seq ordering
  if (isBoardMutating(event.type)) {
    if (event.seq <= rs.lastAppliedSeq && rs.seenEventIds.has(event.eventId)) {
      return rs; // already applied
    }
  }

  const { state: newBoardState, seenEventIds: newSeen } = applyBoardEvent(
    rs.boardState,
    event,
    rs.seenEventIds
  );

  return {
    boardState: newBoardState,
    lastAppliedSeq: Math.max(rs.lastAppliedSeq, event.seq),
    seenEventIds: newSeen,
  };
}

export function applyBufferedEvents(
  rs: RealtimeState,
  buffered: BoardEvent[],
  snapshotSeq: number
): RealtimeState {
  let current = rs;
  // Sort by seq
  const sorted = [...buffered].sort((a, b) => a.seq - b.seq);
  for (const event of sorted) {
    if (event.seq <= snapshotSeq) continue; // already covered by snapshot
    current = applyEventToRealtimeState(current, event);
  }
  return current;
}
