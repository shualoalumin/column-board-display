import React from "react";
import { InputMode } from "../board/boardTypes";

interface Props {
  currentTool: "pen" | "eraser";
  onToolChange: (tool: "pen" | "eraser") => void;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  onUndo: () => void;
  onClearActiveColumn: () => void;
  onClearWholeBoard: () => void;
  onNextColumn: () => void;
  onPreviousColumn: () => void;
  onAddColumn: () => void;
  onRemoveColumn: () => void;
  columnCount: number;
  activeColumnIndex: number;
  roomId?: string;
  connectionStatus?: string;
  onCopyDisplayLink?: () => void;
  onCopyViewerLink?: () => void;
}

const btn: React.CSSProperties = {
  padding: "10px 14px",
  margin: "2px",
  fontSize: "13px",
  fontFamily: "monospace",
  borderRadius: "6px",
  border: "1px solid #555",
  background: "#333",
  color: "#eee",
  cursor: "pointer",
  touchAction: "manipulation",
  minWidth: "44px",
};

const activeBtn: React.CSSProperties = {
  ...btn,
  background: "#3b82f6",
  border: "1px solid #60a5fa",
  color: "#fff",
};

const sep: React.CSSProperties = {
  width: 1,
  height: 30,
  background: "#555",
  margin: "0 6px",
  flexShrink: 0,
};

export const Toolbar: React.FC<Props> = ({
  currentTool,
  onToolChange,
  inputMode,
  onInputModeChange,
  onUndo,
  onClearActiveColumn,
  onClearWholeBoard,
  onNextColumn,
  onPreviousColumn,
  onAddColumn,
  onRemoveColumn,
  columnCount,
  activeColumnIndex,
  connectionStatus,
  onCopyDisplayLink,
  onCopyViewerLink,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        padding: "4px 6px",
        background: "#222",
        borderBottom: "1px solid #444",
        flexShrink: 0,
      }}
    >
      <button style={currentTool === "pen" ? activeBtn : btn} onClick={() => onToolChange("pen")}>
        Pen
      </button>
      <button style={currentTool === "eraser" ? activeBtn : btn} onClick={() => onToolChange("eraser")}>
        Eraser
      </button>

      <div style={sep} />

      <button style={btn} onClick={onUndo}>Undo</button>
      <button
        style={btn}
        onClick={() => { if (confirm("Clear active column?")) onClearActiveColumn(); }}
      >
        Clear Col
      </button>
      <button
        style={btn}
        onClick={() => { if (confirm("Clear WHOLE board?")) onClearWholeBoard(); }}
      >
        Clear All
      </button>

      <div style={sep} />

      <button style={btn} onClick={onPreviousColumn}>◀ Prev</button>
      <span style={{ color: "#aaa", fontFamily: "monospace", fontSize: "12px", padding: "0 6px" }}>
        Col {activeColumnIndex + 1}/{columnCount}
      </span>
      <button style={btn} onClick={onNextColumn}>Next ▶</button>

      <div style={sep} />

      <button style={btn} onClick={onAddColumn}>+ Col</button>
      <button style={{ ...btn, opacity: columnCount <= 1 ? 0.4 : 1 }} onClick={onRemoveColumn} disabled={columnCount <= 1}>
        − Col
      </button>

      <div style={sep} />

      <button
        style={inputMode === "penOnly" ? activeBtn : btn}
        onClick={() => onInputModeChange(inputMode === "penOnly" ? "auto" : "penOnly")}
      >
        Pen Only
      </button>

      {(connectionStatus || onCopyDisplayLink || onCopyViewerLink) && (
        <>
          <div style={sep} />
          {connectionStatus && (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                color: connectionStatus === "connected" ? "#4ade80"
                  : connectionStatus === "local-only" ? "#94a3b8"
                  : "#f87171",
                padding: "0 6px",
              }}
            >
              ● {connectionStatus}
            </span>
          )}
          {onCopyDisplayLink && (
            <button style={btn} onClick={onCopyDisplayLink}>Copy Display Link</button>
          )}
          {onCopyViewerLink && (
            <button style={btn} onClick={onCopyViewerLink}>Copy Viewer Link</button>
          )}
        </>
      )}
    </div>
  );
};
