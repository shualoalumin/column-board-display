import React from "react";
import { InputMode } from "../board/boardTypes";

// Classroom-friendly palette. First entry (near-black) is the default ink.
export const PEN_PALETTE = [
  "#111111",
  "#2563eb",
  "#ef4444",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#a855f7",
];

interface Props {
  currentTool: "pen" | "eraser";
  onToolChange: (tool: "pen" | "eraser") => void;
  currentColor: string;
  onColorChange: (color: string) => void;
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
}

const btn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2px",
  padding: "6px 10px",
  margin: "2px",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  fontFamily: "system-ui, sans-serif",
  borderRadius: "8px",
  border: "1px solid #333b48",
  background: "#1c232e",
  color: "#cbd5e1",
  cursor: "pointer",
  touchAction: "manipulation",
  minWidth: "52px",
  lineHeight: 1.1,
};

const activeBtn: React.CSSProperties = {
  ...btn,
  background: "#f97316",
  border: "1px solid #fb923c",
  color: "#fff",
};

const navActiveBtn: React.CSSProperties = {
  ...btn,
  background: "#3b82f6",
  border: "1px solid #60a5fa",
  color: "#fff",
};

const dangerBtn: React.CSSProperties = {
  ...btn,
  background: "#7f1d1d",
  border: "1px solid #b91c1c",
  color: "#fecaca",
};

const icon: React.CSSProperties = { fontSize: "16px", lineHeight: 1 };

const sep: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  background: "#2a3340",
  margin: "4px 6px",
  flexShrink: 0,
};

export const Toolbar: React.FC<Props> = ({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
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
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        padding: "6px 8px",
        background: "#141a24",
        borderBottom: "1px solid #232b38",
        flexShrink: 0,
      }}
    >
      <button style={currentTool === "pen" ? activeBtn : btn} onClick={() => onToolChange("pen")}>
        <span style={icon}>✏️</span>
        PEN
      </button>
      <button style={currentTool === "eraser" ? activeBtn : btn} onClick={() => onToolChange("eraser")}>
        <span style={icon}>🧽</span>
        ERASER
      </button>

      <div style={sep} />

      {/* Color palette */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 4px" }}>
        {PEN_PALETTE.map((c) => {
          const selected = currentColor.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              onClick={() => {
                onColorChange(c);
                if (currentTool === "eraser") onToolChange("pen");
              }}
              aria-label={`Color ${c}`}
              style={{
                width: selected ? 28 : 22,
                height: selected ? 28 : 22,
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                border: selected ? "3px solid #e2e8f0" : "2px solid #334155",
                boxShadow: selected ? "0 0 0 2px #0ea5e9" : "none",
                padding: 0,
                touchAction: "manipulation",
                transition: "all 0.1s",
              }}
            />
          );
        })}
      </div>

      <div style={sep} />

      <button style={btn} onClick={onUndo}>
        <span style={icon}>↩️</span>
        UNDO
      </button>
      <button
        style={btn}
        onClick={() => {
          if (confirm("Clear active column?")) onClearActiveColumn();
        }}
      >
        <span style={icon}>🗑️</span>
        CLEAR COL
      </button>
      <button
        style={dangerBtn}
        onClick={() => {
          if (confirm("Clear WHOLE board?")) onClearWholeBoard();
        }}
      >
        <span style={icon}>❌</span>
        CLEAR ALL
      </button>

      <div style={sep} />

      <button style={btn} onClick={onPreviousColumn}>
        <span style={icon}>◀</span>
        PREV COL
      </button>
      <span
        style={{
          color: "#94a3b8",
          fontFamily: "monospace",
          fontSize: "14px",
          fontWeight: 700,
          padding: "0 8px",
          minWidth: "34px",
          textAlign: "center",
        }}
      >
        {activeColumnIndex + 1}/{columnCount}
      </span>
      <button style={navActiveBtn} onClick={onNextColumn}>
        <span style={icon}>▶</span>
        NEXT COL
      </button>

      <div style={sep} />

      <button style={btn} onClick={onAddColumn}>
        <span style={icon}>➕</span>
        ADD COL
      </button>
      <button
        style={{ ...btn, opacity: columnCount <= 1 ? 0.4 : 1 }}
        onClick={onRemoveColumn}
        disabled={columnCount <= 1}
      >
        <span style={icon}>➖</span>
        REM COL
      </button>

      <div style={sep} />

      <button
        style={inputMode === "penOnly" ? navActiveBtn : btn}
        onClick={() => onInputModeChange(inputMode === "penOnly" ? "auto" : "penOnly")}
      >
        <span style={icon}>🖊️</span>
        PEN ONLY
      </button>
    </div>
  );
};
