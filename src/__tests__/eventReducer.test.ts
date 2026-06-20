import { describe, it, expect } from "vitest";
import { applyEventToRealtimeState, applyBufferedEvents, RealtimeState } from "../realtime/eventReducer";
import { BoardEvent, BoardState, Stroke, createDefaultBoardState } from "../board/boardTypes";

function makeState(boardState?: BoardState): RealtimeState {
  return {
    boardState: boardState ?? createDefaultBoardState(),
    lastAppliedSeq: 0,
    seenEventIds: new Set(),
  };
}

function makeEvent(overrides: Partial<BoardEvent>): BoardEvent {
  return {
    eventId: "evt-1",
    roomId: "room-1",
    boardId: "board-1",
    seq: 1,
    senderId: "sender-1",
    senderRole: "teacher",
    type: "strokeCommitted",
    payload: {},
    sentAt: Date.now(),
    ...overrides,
  };
}

const SAMPLE_STROKE: Stroke = {
  id: "stroke-1",
  columnId: "col-1",
  tool: "pen",
  color: "#000",
  width: 8,
  points: [{ x: 100, y: 200, timestamp: 0 }],
};

describe("strokeCommitted", () => {
  it("appends stroke to correct column", () => {
    const rs = makeState();
    const event = makeEvent({ type: "strokeCommitted", payload: { stroke: SAMPLE_STROKE } });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState.columns[0].strokes).toHaveLength(1);
    expect(next.boardState.columns[0].strokes[0].id).toBe("stroke-1");
  });

  it("ignores duplicate eventId", () => {
    const rs = makeState();
    const event = makeEvent({ type: "strokeCommitted", payload: { stroke: SAMPLE_STROKE } });
    const rs2 = applyEventToRealtimeState(rs, event);
    const rs3 = applyEventToRealtimeState(rs2, event);
    expect(rs3.boardState.columns[0].strokes).toHaveLength(1);
  });
});

describe("clearActiveColumn", () => {
  it("clears only the active column", () => {
    const boardState = createDefaultBoardState();
    boardState.columns[0].strokes = [SAMPLE_STROKE];
    boardState.columns[1].strokes = [{ ...SAMPLE_STROKE, id: "s2", columnId: "col-2" }];
    const rs = makeState(boardState);
    const event = makeEvent({ type: "clearActiveColumn" });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState.columns[0].strokes).toHaveLength(0);
    expect(next.boardState.columns[1].strokes).toHaveLength(1);
  });
});

describe("clearWholeBoard", () => {
  it("clears all columns", () => {
    const boardState = createDefaultBoardState();
    boardState.columns[0].strokes = [SAMPLE_STROKE];
    boardState.columns[1].strokes = [{ ...SAMPLE_STROKE, id: "s2", columnId: "col-2" }];
    const rs = makeState(boardState);
    const event = makeEvent({ type: "clearWholeBoard" });
    const next = applyEventToRealtimeState(rs, event);
    next.boardState.columns.forEach((col) => {
      expect(col.strokes).toHaveLength(0);
    });
  });
});

describe("nextColumn", () => {
  it("changes activeColumnId to next column", () => {
    const rs = makeState();
    expect(rs.boardState.activeColumnId).toBe("col-1");
    const event = makeEvent({ type: "nextColumn" });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState.activeColumnId).toBe("col-2");
  });
});

describe("removeColumn", () => {
  it("never removes the last column", () => {
    const boardState = createDefaultBoardState();
    boardState.columns = [{ id: "col-1", strokes: [] }];
    boardState.activeColumnId = "col-1";
    const rs = makeState(boardState);
    const event = makeEvent({ type: "removeColumn" });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState.columns).toHaveLength(1);
  });
});

describe("snapshotResponse", () => {
  it("replaces entire board state", () => {
    const rs = makeState();
    const newState = createDefaultBoardState();
    newState.columns[0].strokes = [SAMPLE_STROKE];
    const event = makeEvent({
      eventId: "snap-1",
      type: "snapshotResponse",
      payload: { boardState: newState, seq: 5 },
    });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState.columns[0].strokes).toHaveLength(1);
    expect(next.lastAppliedSeq).toBe(5);
  });
});

describe("applyBufferedEvents", () => {
  it("replays events with seq > snapshotSeq", () => {
    const rs = makeState();
    const buffered: BoardEvent[] = [
      makeEvent({ eventId: "e1", seq: 3, type: "strokeCommitted", payload: { stroke: SAMPLE_STROKE } }),
      makeEvent({ eventId: "e2", seq: 6, type: "strokeCommitted", payload: { stroke: { ...SAMPLE_STROKE, id: "s2" } } }),
    ];
    const next = applyBufferedEvents(rs, buffered, 4);
    expect(next.boardState.columns[0].strokes).toHaveLength(1);
    expect(next.boardState.columns[0].strokes[0].id).toBe("s2");
  });

  it("ignores events with seq <= snapshotSeq", () => {
    const rs = makeState();
    const buffered: BoardEvent[] = [
      makeEvent({ eventId: "e1", seq: 2, type: "strokeCommitted", payload: { stroke: SAMPLE_STROKE } }),
    ];
    const next = applyBufferedEvents(rs, buffered, 5);
    expect(next.boardState.columns[0].strokes).toHaveLength(0);
  });

  it("ignores duplicate eventIds", () => {
    const rs = makeState();
    const buffered: BoardEvent[] = [
      makeEvent({ eventId: "e1", seq: 6, type: "strokeCommitted", payload: { stroke: SAMPLE_STROKE } }),
      makeEvent({ eventId: "e1", seq: 7, type: "strokeCommitted", payload: { stroke: { ...SAMPLE_STROKE, id: "s2" } } }),
    ];
    const next = applyBufferedEvents(rs, buffered, 5);
    expect(next.boardState.columns[0].strokes).toHaveLength(1);
  });
});

describe("role safety", () => {
  it("ignores board-mutating events from viewer role", () => {
    const rs = makeState();
    const event = makeEvent({
      type: "strokeCommitted",
      payload: { stroke: SAMPLE_STROKE },
      senderRole: "viewer",
    });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState.columns[0].strokes).toHaveLength(0);
  });

  it("ignores board-mutating events from display role", () => {
    const rs = makeState();
    const event = makeEvent({ type: "clearWholeBoard", senderRole: "display" });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState).toBe(rs.boardState);
  });
});
