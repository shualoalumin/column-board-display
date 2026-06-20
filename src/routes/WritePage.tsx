import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { TeacherCanvas } from "../components/TeacherCanvas";
import { Toolbar, PEN_PALETTE, PEN_WIDTHS } from "../components/Toolbar";
import { DebugPanel } from "../components/DebugPanel";
import { useBoardState } from "../board/useBoardState";
import { InputMode, Stroke, createDefaultBoardState } from "../board/boardTypes";
import { supabaseConfigured } from "../realtime/supabaseClient";
import { useBoardRealtime } from "../realtime/useBoardRealtime";
import {
  loadTeacherStateFromLocalStorage,
  saveTeacherStateToLocalStorage,
} from "../realtime/boardEvents";

const linkBtn: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: "6px",
  border: "1px solid #333b48",
  background: "#1c232e",
  color: "#cbd5e1",
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
};

export const WritePage: React.FC = () => {
  const { roomId = "local" } = useParams<{ roomId: string }>();
  const boardId = useRef(`board-${roomId}`).current;

  const savedState = loadTeacherStateFromLocalStorage(roomId);
  const [restoredNotice, setRestoredNotice] = useState(!!savedState);

  const {
    boardState,
    addStroke,
    undo,
    clearActiveColumn,
    clearWholeBoard,
    goNextColumn,
    goPreviousColumn,
    addColumn,
    removeColumn,
  } = useBoardState(savedState?.boardState ?? createDefaultBoardState());

  const [currentTool, setCurrentTool] = useState<"pen" | "eraser">("pen");
  const [currentColor, setCurrentColor] = useState<string>(PEN_PALETTE[0]);
  const [currentWidth, setCurrentWidth] = useState<number>(PEN_WIDTHS[1]);
  const [inputMode, setInputMode] = useState<InputMode>("auto");
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const seqRef = useRef(savedState?.seq ?? 0);

  const { connectionStatus, sendEvent } = useBoardRealtime({
    roomId,
    boardId,
    role: "teacher",
    initialBoardState: boardState,
    onBoardStateChange: () => {},
  });

  useEffect(() => {
    saveTeacherStateToLocalStorage(roomId, boardState, seqRef.current);
  }, [boardState, roomId]);

  useEffect(() => {
    if (restoredNotice) {
      const t = setTimeout(() => setRestoredNotice(false), 3000);
      return () => clearTimeout(t);
    }
  }, [restoredNotice]);

  const activeColIdx = boardState.columns.findIndex((c) => c.id === boardState.activeColumnId);

  const onStrokeCommitted = useCallback(
    (stroke: Stroke) => {
      addStroke(stroke);
      sendEvent("strokeCommitted", { stroke });
    },
    [addStroke, sendEvent]
  );

  const handleUndo = useCallback(() => { undo(); sendEvent("undo", {}); }, [undo, sendEvent]);
  const handleClearActiveColumn = useCallback(() => { clearActiveColumn(); sendEvent("clearActiveColumn", {}); }, [clearActiveColumn, sendEvent]);
  const handleClearWholeBoard = useCallback(() => { clearWholeBoard(); sendEvent("clearWholeBoard", {}); }, [clearWholeBoard, sendEvent]);
  const handleNextColumn = useCallback(() => { goNextColumn(); sendEvent("nextColumn", {}); }, [goNextColumn, sendEvent]);
  const handlePreviousColumn = useCallback(() => { goPreviousColumn(); sendEvent("previousColumn", {}); }, [goPreviousColumn, sendEvent]);
  const handleAddColumn = useCallback(() => { addColumn(); sendEvent("addColumn", {}); }, [addColumn, sendEvent]);
  const handleRemoveColumn = useCallback(() => { removeColumn(); sendEvent("removeColumn", {}); }, [removeColumn, sendEvent]);

  const copyLink = (path: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).catch(() => prompt("Copy this link:", url));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", background: "#111", overflow: "hidden" }}>
      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        currentWidth={currentWidth}
        onWidthChange={setCurrentWidth}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        onUndo={handleUndo}
        onClearActiveColumn={handleClearActiveColumn}
        onClearWholeBoard={handleClearWholeBoard}
        onNextColumn={handleNextColumn}
        onPreviousColumn={handlePreviousColumn}
        onAddColumn={handleAddColumn}
        onRemoveColumn={handleRemoveColumn}
        columnCount={boardState.columns.length}
        activeColumnIndex={activeColIdx}
      />

      {/* Status / room link bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px",
          padding: "6px 10px",
          background: "#10151d",
          borderBottom: "1px solid #232b38",
          fontFamily: "system-ui, sans-serif",
          fontSize: "12px",
          flexShrink: 0,
        }}
      >
        {restoredNotice && (
          <span
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              background: "#064e3b",
              color: "#6ee7b7",
              fontWeight: 600,
            }}
          >
            ↻ Restored local state
          </span>
        )}
        <span
          style={{
            color: !supabaseConfigured ? "#94a3b8"
              : connectionStatus === "connected" ? "#4ade80"
              : "#f87171",
            fontWeight: 600,
          }}
        >
          ● {supabaseConfigured ? connectionStatus : "local-only"}
        </span>
        <span style={{ color: "#64748b", fontFamily: "monospace" }}>
          Room {roomId.slice(0, 8)}…
        </span>
        <button style={linkBtn} onClick={() => copyLink(`/display/${roomId}`)}>
          📺 Copy display link
        </button>
        <button style={linkBtn} onClick={() => copyLink(`/viewer/${roomId}`)}>
          👁 Copy viewer link
        </button>
      </div>

      <div style={{ flex: 1, overflow: "hidden", padding: "12px", minHeight: 0 }}>
        <TeacherCanvas
          boardState={boardState}
          onStrokeCommitted={onStrokeCommitted}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          currentColor={currentColor}
          currentWidth={currentWidth}
          showDebug={showDebug}
          onDebugInfo={(info) =>
            setDebugInfo({
              ...info,
              activeColumnId: boardState.activeColumnId,
              columnCount: boardState.columns.length,
            })
          }
        />
      </div>
      <button
        onClick={() => setShowDebug((v) => !v)}
        style={{
          position: "fixed", bottom: 8, left: 8, padding: "4px 8px",
          background: "#333", color: "#aaa", border: "1px solid #555",
          borderRadius: "4px", fontSize: "11px", cursor: "pointer", zIndex: 10000,
          fontFamily: "monospace",
        }}
      >
        {showDebug ? "Hide Debug" : "Debug"}
      </button>
      <DebugPanel info={debugInfo} visible={showDebug} />
    </div>
  );
};
