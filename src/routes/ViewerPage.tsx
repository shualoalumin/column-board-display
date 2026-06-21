import React, { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { ViewerBoard } from "../components/ViewerBoard";
import { createDefaultBoardState, BoardState, Stroke } from "../board/boardTypes";
import { supabaseConfigured } from "../realtime/supabaseClient";
import { useBoardRealtime } from "../realtime/useBoardRealtime";

export const ViewerPage: React.FC = () => {
  const { roomId = "local" } = useParams<{ roomId: string }>();
  const boardId = `board-${roomId}`;
  const [boardState, setBoardState] = useState<BoardState>(createDefaultBoardState());
  const [liveStroke, setLiveStroke] = useState<Stroke | null>(null);

  const onBoardStateChange = useCallback((state: BoardState) => {
    setBoardState(state);
  }, []);

  const onLiveStroke = useCallback((stroke: Stroke | null) => {
    setLiveStroke(stroke);
  }, []);

  const { connectionStatus } = useBoardRealtime({
    roomId,
    boardId,
    role: "viewer",
    initialBoardState: boardState,
    onBoardStateChange,
    onLiveStroke,
  });

  const status = supabaseConfigured ? connectionStatus : "disconnected";
  const statusColor = status === "connected" ? "#4ade80" : "#fbbf24";

  return (
    <div style={{ width: "100dvw", height: "100dvh", background: "#111", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{
        padding: "3px 10px",
        background: "#0a0a0a",
        color: statusColor,
        fontSize: "10px",
        fontFamily: "monospace",
        flexShrink: 0,
      }}>
        ● {status === "waiting" ? "Waiting for teacher…" : status}
        {!supabaseConfigured && " — Supabase not configured"}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ViewerBoard boardState={boardState} liveStroke={liveStroke} />
      </div>
    </div>
  );
};
