import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { TeacherCanvas } from "../components/TeacherCanvas";
import { WriteToolbar } from "../components/WriteToolbar";
import { PEN_PALETTE, PEN_WIDTHS } from "../components/penConstants";
import { useBoardState } from "../board/useBoardState";
import { InputMode, Stroke, createDefaultBoardState } from "../board/boardTypes";
import { supabaseConfigured } from "../realtime/supabaseClient";
import { useBoardRealtime } from "../realtime/useBoardRealtime";
import {
  loadTeacherStateFromLocalStorage,
  saveTeacherStateToLocalStorage,
} from "../realtime/boardEvents";

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

  const connectionLabel = !supabaseConfigured
    ? "local-only"
    : connectionStatus;
  const connectionColor = !supabaseConfigured
    ? "#94a3b8"
    : connectionStatus === "connected"
    ? "#4ade80"
    : "#f87171";

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#1c1c1e",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      {/* Edge-to-edge canvas */}
      <div style={{ position: "absolute", inset: 0 }}>
        <TeacherCanvas
          boardState={boardState}
          onStrokeCommitted={onStrokeCommitted}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          currentColor={currentColor}
          currentWidth={currentWidth}
        />
      </div>

      {/* Tiny status dot, top-right */}
      <div
        style={{
          position: "absolute",
          top: "max(10px, env(safe-area-inset-top))",
          right: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 9px",
          borderRadius: "999px",
          background: "rgba(28,28,30,0.7)",
          border: "1px solid #3a3a3c",
          color: connectionColor,
          fontSize: "11px",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 600,
          pointerEvents: "none",
        }}
      >
        ● {connectionLabel}
      </div>

      {restoredNotice && (
        <div
          style={{
            position: "absolute",
            top: "max(10px, env(safe-area-inset-top))",
            left: "12px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: "#064e3b",
            color: "#6ee7b7",
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            pointerEvents: "none",
          }}
        >
          ↻ Restored
        </div>
      )}

      <WriteToolbar
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
        connectionLabel={connectionLabel}
        connectionColor={connectionColor}
        onCopyDisplay={() => copyLink(`/display/${roomId}`)}
        onCopyViewer={() => copyLink(`/viewer/${roomId}`)}
      />
    </div>
  );
};
