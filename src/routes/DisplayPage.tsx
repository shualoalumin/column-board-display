import React, { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { DisplayBoard } from "../components/DisplayBoard";
import { createDefaultBoardState, BoardState } from "../board/boardTypes";
import { supabaseConfigured } from "../realtime/supabaseClient";
import { useBoardRealtime, ConnectionStatus } from "../realtime/useBoardRealtime";

export const DisplayPage: React.FC = () => {
  const { roomId = "local" } = useParams<{ roomId: string }>();
  const boardId = `board-${roomId}`;
  const [boardState, setBoardState] = useState<BoardState>(createDefaultBoardState());

  const onBoardStateChange = useCallback((state: BoardState) => {
    setBoardState(state);
  }, []);

  const { connectionStatus } = useBoardRealtime({
    roomId,
    boardId,
    role: "display",
    initialBoardState: boardState,
    onBoardStateChange,
  });

  const status: ConnectionStatus = supabaseConfigured ? connectionStatus : "disconnected";

  const statusColor =
    status === "connected" ? "#4ade80"
    : status === "waiting" ? "#fbbf24"
    : "#f87171";

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{
        padding: "4px 12px",
        background: "#111",
        color: statusColor,
        fontSize: "11px",
        fontFamily: "monospace",
        display: "flex",
        gap: "12px",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <span>● {status === "waiting" ? "Waiting for teacher…" : status}</span>
        <span style={{ color: "#555" }}>Room: {roomId.slice(0, 8)}…</span>
        {!supabaseConfigured && <span style={{ color: "#f87171" }}>Supabase not configured</span>}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {(status === "waiting" || status === "connecting") && supabaseConfigured ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", color: "#555", fontFamily: "monospace", fontSize: "1.2rem",
          }}>
            Waiting for teacher connection…
          </div>
        ) : (
          <DisplayBoard boardState={boardState} showActiveHighlight />
        )}
      </div>
    </div>
  );
};
