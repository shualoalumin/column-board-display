import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { TeacherCanvas } from "../components/TeacherCanvas";
import { DisplayBoard } from "../components/DisplayBoard";
import { Toolbar } from "../components/Toolbar";
import { DebugPanel } from "../components/DebugPanel";
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
        roomId={roomId}
        connectionStatus={supabaseConfigured ? connectionStatus : "local-only"}
        onCopyDisplayLink={() => copyLink(`/display/${roomId}`)}
        onCopyViewerLink={() => copyLink(`/viewer/${roomId}`)}
      />
      {restoredNotice && (
        <div style={{ background: "#1d4ed8", color: "#fff", padding: "4px 12px", fontSize: "12px", fontFamily: "monospace", flexShrink: 0 }}>
          Restored local room state.
        </div>
      )}
      {!supabaseConfigured && (
        <div style={{ background: "#7c2d12", color: "#fca5a5", padding: "3px 12px", fontSize: "11px", fontFamily: "monospace", flexShrink: 0 }}>
          Supabase not configured — running local-only. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for realtime.
        </div>
      )}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: "8px", padding: "8px", minHeight: 0 }}>
        <div style={{ flex: "0 0 auto", width: "min(45%, 360px)", height: "100%" }}>
          <TeacherCanvas
            boardState={boardState}
            onStrokeCommitted={onStrokeCommitted}
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            currentTool={currentTool}
            currentColor="#1a1a1a"
            currentWidth={8}
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
        <div style={{ flex: 1, height: "100%", minWidth: 0 }}>
          <DisplayBoard boardState={boardState} showActiveHighlight />
        </div>
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
