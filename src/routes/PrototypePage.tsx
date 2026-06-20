import React, { useCallback, useState } from "react";
import { TeacherCanvas } from "../components/TeacherCanvas";
import { DisplayBoard } from "../components/DisplayBoard";
import { Toolbar, PEN_PALETTE, PEN_WIDTHS } from "../components/Toolbar";
import { DebugPanel } from "../components/DebugPanel";
import { useBoardState } from "../board/useBoardState";
import { InputMode, Stroke } from "../board/boardTypes";

export const PrototypePage: React.FC = () => {
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
  } = useBoardState();

  const [currentTool, setCurrentTool] = useState<"pen" | "eraser">("pen");
  const [currentColor, setCurrentColor] = useState<string>(PEN_PALETTE[0]);
  const [currentWidth, setCurrentWidth] = useState<number>(PEN_WIDTHS[1]);
  const [inputMode, setInputMode] = useState<InputMode>("auto");
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});

  const activeColIdx = boardState.columns.findIndex((c) => c.id === boardState.activeColumnId);

  const onStrokeCommitted = useCallback(
    (stroke: Stroke) => {
      addStroke(stroke);
    },
    [addStroke]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        background: "#111",
        overflow: "hidden",
      }}
    >
      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        currentWidth={currentWidth}
        onWidthChange={setCurrentWidth}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        onUndo={undo}
        onClearActiveColumn={clearActiveColumn}
        onClearWholeBoard={clearWholeBoard}
        onNextColumn={goNextColumn}
        onPreviousColumn={goPreviousColumn}
        onAddColumn={addColumn}
        onRemoveColumn={removeColumn}
        columnCount={boardState.columns.length}
        activeColumnIndex={activeColIdx}
      />
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          gap: "8px",
          padding: "8px",
          minHeight: 0,
        }}
      >
        <div style={{ flex: "0 0 auto", width: "min(45%, 360px)", height: "100%" }}>
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
        <div style={{ flex: 1, height: "100%", minWidth: 0 }}>
          <DisplayBoard boardState={boardState} showActiveHighlight />
        </div>
      </div>
      <button
        onClick={() => setShowDebug((v) => !v)}
        style={{
          position: "fixed",
          bottom: 8,
          left: 8,
          padding: "4px 8px",
          background: "#333",
          color: "#aaa",
          border: "1px solid #555",
          borderRadius: "4px",
          fontSize: "11px",
          cursor: "pointer",
          zIndex: 10000,
          fontFamily: "monospace",
        }}
      >
        {showDebug ? "Hide Debug" : "Debug"}
      </button>
      <DebugPanel info={debugInfo} visible={showDebug} />
    </div>
  );
};
