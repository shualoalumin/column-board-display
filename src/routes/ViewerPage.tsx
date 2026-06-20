import React, { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { ViewerBoard } from "../components/ViewerBoard";
import { createDefaultBoardState, BoardState } from "../board/boardTypes";
import { supabaseConfigured } from "../realtime/supabaseClient";
import { useBoardRealtime } from "../realtime/useBoardRealtime";

export const ViewerPage: React.FC = () => {
  const { roomId = "local" } = useParams<{ roomId: string }>();
  const boardId = `board-${roomId}`;
  const [boardState, setBoardState] = useState<BoardState>(createDefaultBoardState());

  const onBoardStateChange = useCallback((state: BoardState) => {
    setBoardState(state);
  }, []);

  const { connectionStatus } = useBoardRealtime({
    roomId,
    boardId,
    role: "viewer",
    initialBoardState: boardState,
    onBoardStateChange,
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
        <ViewerBoard boardState={boardState} />
      </div>
    </div>
  );
};
