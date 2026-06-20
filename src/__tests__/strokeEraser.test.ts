import { describe, it, expect } from "vitest";
import { strokeHitsPoint } from "../geometry/strokeHitTest";
import { eraseStrokes } from "../board/boardActions";
import { applyEventToRealtimeState, RealtimeState } from "../realtime/eventReducer";
import { BoardEvent, BoardState, Stroke, createDefaultBoardState } from "../board/boardTypes";

const line: Stroke = {
  id: "s1",
  columnId: "col-1",
  tool: "pen",
  color: "#fff",
  width: 8,
  points: [
    { x: 100, y: 100, timestamp: 0 },
    { x: 200, y: 100, timestamp: 1 },
  ],
};

describe("strokeHitsPoint", () => {
  it("hits when the eraser disc overlaps the stroke", () => {
    expect(strokeHitsPoint(line, 150, 103, 10)).toBe(true);
  });

  it("misses when the eraser disc is far from the stroke", () => {
    expect(strokeHitsPoint(line, 150, 300, 10)).toBe(false);
  });

  it("accounts for stroke half-width and eraser radius at the boundary", () => {
    // distance 20 away; threshold = radius(10) + halfWidth(4) = 14 -> miss
    expect(strokeHitsPoint(line, 150, 120, 10)).toBe(false);
    // distance 12 away; threshold 14 -> hit
    expect(strokeHitsPoint(line, 150, 112, 10)).toBe(true);
  });

  it("never erases eraser strokes", () => {
    expect(strokeHitsPoint({ ...line, tool: "eraser" }, 150, 100, 50)).toBe(false);
  });
});

describe("eraseStrokes action", () => {
  it("removes only the listed strokes from the target column", () => {
    const state = createDefaultBoardState();
    state.columns[0].strokes = [line, { ...line, id: "s2" }, { ...line, id: "s3" }];
    const next = eraseStrokes(state, "col-1", ["s1", "s3"]);
    expect(next.columns[0].strokes.map((s) => s.id)).toEqual(["s2"]);
  });

  it("does not touch other columns", () => {
    const state = createDefaultBoardState();
    state.columns[0].strokes = [line];
    state.columns[1].strokes = [{ ...line, id: "s2", columnId: "col-2" }];
    const next = eraseStrokes(state, "col-1", ["s1"]);
    expect(next.columns[0].strokes).toHaveLength(0);
    expect(next.columns[1].strokes).toHaveLength(1);
  });
});

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
    type: "eraseStrokes",
    payload: {},
    sentAt: Date.now(),
    ...overrides,
  };
}

describe("eraseStrokes realtime event", () => {
  it("applies an eraseStrokes event from the teacher", () => {
    const boardState = createDefaultBoardState();
    boardState.columns[0].strokes = [line, { ...line, id: "s2" }];
    const rs = makeState(boardState);
    const event = makeEvent({ payload: { columnId: "col-1", strokeIds: ["s1"] } });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState.columns[0].strokes.map((s) => s.id)).toEqual(["s2"]);
  });

  it("ignores eraseStrokes from a non-teacher sender", () => {
    const boardState = createDefaultBoardState();
    boardState.columns[0].strokes = [line];
    const rs = makeState(boardState);
    const event = makeEvent({
      senderRole: "viewer",
      payload: { columnId: "col-1", strokeIds: ["s1"] },
    });
    const next = applyEventToRealtimeState(rs, event);
    expect(next.boardState.columns[0].strokes).toHaveLength(1);
  });
});
