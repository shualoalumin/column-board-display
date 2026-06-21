import { useCallback, useEffect, useRef, useState } from "react";
import { BoardEvent, BoardState, NetworkEventType, Stroke, UserRole } from "../board/boardTypes";
import { supabase, supabaseConfigured } from "./supabaseClient";
import { createBoardEvent, getSenderId, isBoardMutating, saveTeacherStateToLocalStorage } from "./boardEvents";
import { applyEventToRealtimeState, applyBufferedEvents, RealtimeState } from "./eventReducer";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "waiting";

interface Options {
  roomId: string;
  boardId: string;
  role: UserRole;
  initialBoardState: BoardState;
  onBoardStateChange: (state: BoardState) => void;
  // Live (in-progress) stroke streaming. null clears the live stroke.
  onLiveStroke?: (stroke: Stroke | null) => void;
}

interface RealtimeAPI {
  connectionStatus: ConnectionStatus;
  sendEvent: (type: NetworkEventType, payload: unknown) => void;
  seq: number;
}

export function useBoardRealtime({
  roomId,
  boardId,
  role,
  initialBoardState,
  onBoardStateChange,
  onLiveStroke,
}: Options): RealtimeAPI {
  const onLiveStrokeRef = useRef(onLiveStroke);
  onLiveStrokeRef.current = onLiveStroke;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const seqRef = useRef(0);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const realtimeStateRef = useRef<RealtimeState>({
    boardState: initialBoardState,
    lastAppliedSeq: 0,
    seenEventIds: new Set(),
  });
  const preSnapshotBufferRef = useRef<BoardEvent[]>([]);
  const snapshotReceivedRef = useRef(false);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const senderId = getSenderId();

  const sendEvent = useCallback((type: NetworkEventType, payload: unknown) => {
    if (!supabaseConfigured || !channelRef.current) return;

    // Only teacher can send board-mutating events
    if (isBoardMutating(type) && role !== "teacher") {
      console.warn("[useBoardRealtime] Non-teacher attempted to send board-mutating event:", type);
      return;
    }

    // Only teacher and non-board-mutating types for display/viewer
    if (role !== "teacher" && type !== "snapshotRequest") {
      return;
    }

    const seq = isBoardMutating(type) ? ++seqRef.current : seqRef.current;
    const event = createBoardEvent(type, roomId, boardId, seq, role, payload);

    channelRef.current.send({
      type: "broadcast",
      event: "board",
      payload: event,
    });
  }, [role, roomId, boardId]);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setConnectionStatus("disconnected");
      return;
    }

    const channelName = `column-board:${roomId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel.on("broadcast", { event: "board" }, ({ payload }: { payload: BoardEvent }) => {
      const event = payload as BoardEvent;

      // Teacher receives snapshotRequest → respond with full state
      if (role === "teacher" && event.type === "snapshotRequest" && event.senderId !== senderId) {
        const currentState = realtimeStateRef.current.boardState;
        sendEvent("snapshotResponse", {
          boardState: currentState,
          seq: seqRef.current,
          boardId,
          teacherSenderId: senderId,
          timestamp: Date.now(),
        });
        return;
      }

      // Live stroke progress is ephemeral: never buffered, deduped, or applied
      // to committed board state. Render it directly on display/viewer.
      if (event.type === "strokeProgress") {
        if (role !== "teacher" && event.senderRole === "teacher") {
          const { stroke } = (event.payload as { stroke: Stroke | null }) ?? { stroke: null };
          onLiveStrokeRef.current?.(stroke);
        }
        return;
      }

      // A committed stroke supersedes any in-progress live stroke.
      if (event.type === "strokeCommitted" && role !== "teacher") {
        onLiveStrokeRef.current?.(null);
      }

      // Display/viewer: buffer events before snapshot arrives
      if (role !== "teacher" && !snapshotReceivedRef.current) {
        if (event.type === "snapshotResponse") {
          snapshotReceivedRef.current = true;
          const payload2 = event.payload as { boardState: BoardState; seq: number };
          realtimeStateRef.current = {
            boardState: payload2.boardState,
            lastAppliedSeq: payload2.seq,
            seenEventIds: new Set([event.eventId]),
          };
          // Replay buffered events
          realtimeStateRef.current = applyBufferedEvents(
            realtimeStateRef.current,
            preSnapshotBufferRef.current,
            payload2.seq
          );
          preSnapshotBufferRef.current = [];
          onBoardStateChange(realtimeStateRef.current.boardState);
          setConnectionStatus("connected");
        } else {
          preSnapshotBufferRef.current.push(event);
        }
        return;
      }

      // Apply event
      const newRS = applyEventToRealtimeState(realtimeStateRef.current, event);
      realtimeStateRef.current = newRS;

      if (role !== "teacher") {
        onBoardStateChange(newRS.boardState);
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setConnectionStatus(role === "teacher" ? "connected" : "waiting");
        if (role !== "teacher") {
          // Request snapshot after brief delay
          setTimeout(() => {
            sendEvent("snapshotRequest", {});
          }, 500);
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setConnectionStatus("reconnecting");
      } else if (status === "CLOSED") {
        setConnectionStatus("disconnected");
      }
    });

    // Teacher heartbeat
    if (role === "teacher") {
      heartbeatIntervalRef.current = setInterval(() => {
        sendEvent("teacherHeartbeat", { seq: seqRef.current, updatedAt: Date.now() });
      }, 5000);
    }

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      channel.unsubscribe();
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, boardId, role, senderId]);

  // Teacher: sync board state to realtimeStateRef so snapshot responses are accurate
  const updateTeacherState = useCallback((state: BoardState) => {
    if (role === "teacher") {
      realtimeStateRef.current = {
        ...realtimeStateRef.current,
        boardState: state,
      };
      saveTeacherStateToLocalStorage(roomId, state, seqRef.current);
    }
  }, [role, roomId]);

  void updateTeacherState; // suppress unused warning

  return { connectionStatus, sendEvent, seq: seqRef.current };
}
