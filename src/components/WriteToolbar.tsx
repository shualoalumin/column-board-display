import React, { useState } from "react";
import { InputMode } from "../board/boardTypes";
import { PEN_PALETTE, PEN_WIDTHS } from "./penConstants";

interface Props {
  currentTool: "pen" | "eraser";
  onToolChange: (tool: "pen" | "eraser") => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  currentWidth: number;
  onWidthChange: (width: number) => void;
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
  connectionLabel: string;
  connectionColor: string;
  onCopyDisplay: () => void;
  onCopyViewer: () => void;
}

type Popup = "pen" | "eraser" | "more" | null;

const bar: React.CSSProperties = {
  position: "absolute",
  bottom: "max(14px, env(safe-area-inset-bottom))",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "6px",
  background: "rgba(44,44,46,0.96)",
  border: "1px solid #3a3a3c",
  borderRadius: "18px",
  boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
  backdropFilter: "blur(8px)",
  zIndex: 50,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const iconBtn: React.CSSProperties = {
  width: 46,
  height: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "13px",
  border: "none",
  background: "transparent",
  color: "#e5e7eb",
  fontSize: "20px",
  cursor: "pointer",
  touchAction: "manipulation",
  padding: 0,
};

const iconBtnActive: React.CSSProperties = {
  ...iconBtn,
  background: "#3b82f6",
  color: "#fff",
};

const sep: React.CSSProperties = {
  width: 1,
  height: 28,
  background: "#48484a",
  margin: "0 3px",
  flexShrink: 0,
};

const popupCard: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 10px)",
  background: "rgba(44,44,46,0.98)",
  border: "1px solid #3a3a3c",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  zIndex: 51,
};

const popupRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const menuItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "none",
  background: "transparent",
  color: "#e5e7eb",
  fontSize: "14px",
  fontFamily: "system-ui, sans-serif",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  touchAction: "manipulation",
};

export const WriteToolbar: React.FC<Props> = ({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  currentWidth,
  onWidthChange,
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
  connectionLabel,
  connectionColor,
  onCopyDisplay,
  onCopyViewer,
}) => {
  const [popup, setPopup] = useState<Popup>(null);

  const tapPen = () => {
    if (currentTool === "pen") {
      setPopup((p) => (p === "pen" ? null : "pen"));
    } else {
      onToolChange("pen");
      setPopup("pen");
    }
  };

  const tapEraser = () => {
    if (currentTool === "eraser") {
      setPopup((p) => (p === "eraser" ? null : "eraser"));
    } else {
      onToolChange("eraser");
      setPopup("eraser");
    }
  };

  const tapMore = () => setPopup((p) => (p === "more" ? null : "more"));

  return (
    <>
      {popup && (
        <div
          onPointerDown={() => setPopup(null)}
          style={{ position: "fixed", inset: 0, zIndex: 49 }}
        />
      )}

      <div style={bar}>
        {/* Pen popup: colors + widths */}
        {popup === "pen" && (
          <div style={{ ...popupCard, left: 0 }}>
            <div style={popupRow}>
              {PEN_PALETTE.map((c) => {
                const selected = currentColor.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    onClick={() => onColorChange(c)}
                    aria-label={`Color ${c}`}
                    style={{
                      width: selected ? 30 : 26,
                      height: selected ? 30 : 26,
                      borderRadius: "50%",
                      background: c,
                      cursor: "pointer",
                      border: selected ? "2px solid #fff" : "2px solid #555",
                      boxShadow: selected ? "0 0 0 2px #3b82f6" : "none",
                      padding: 0,
                      touchAction: "manipulation",
                    }}
                  />
                );
              })}
            </div>
            <div style={popupRow}>
              {PEN_WIDTHS.map((w) => {
                const selected = currentWidth === w;
                const dot = Math.round(4 + w * 0.9);
                return (
                  <button
                    key={w}
                    onClick={() => onWidthChange(w)}
                    aria-label={`Width ${w}`}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      background: selected ? "#3b82f6" : "#3a3a3c",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      touchAction: "manipulation",
                    }}
                  >
                    <div
                      style={{
                        width: dot,
                        height: dot,
                        borderRadius: "50%",
                        background: selected ? "#fff" : "#cbd5e1",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Eraser popup: clear options */}
        {popup === "eraser" && (
          <div style={{ ...popupCard, left: 46 }}>
            <button
              style={menuItem}
              onClick={() => {
                if (confirm("Clear active column?")) onClearActiveColumn();
                setPopup(null);
              }}
            >
              🗑️ Clear column
            </button>
            <button
              style={{ ...menuItem, color: "#fca5a5" }}
              onClick={() => {
                if (confirm("Clear WHOLE board?")) onClearWholeBoard();
                setPopup(null);
              }}
            >
              ❌ Clear all
            </button>
          </div>
        )}

        {/* More popup: columns, mode, links, status */}
        {popup === "more" && (
          <div style={{ ...popupCard, right: 0, minWidth: 210 }}>
            <button style={menuItem} onClick={() => { onAddColumn(); }}>
              ➕ Add column
            </button>
            <button
              style={{ ...menuItem, opacity: columnCount <= 1 ? 0.4 : 1 }}
              disabled={columnCount <= 1}
              onClick={() => { onRemoveColumn(); }}
            >
              ➖ Remove current column
            </button>
            <button
              style={menuItem}
              onClick={() =>
                onInputModeChange(inputMode === "penOnly" ? "auto" : "penOnly")
              }
            >
              {inputMode === "penOnly" ? "✅" : "🖊️"} Pen-only mode
            </button>
            <div style={{ height: 1, background: "#48484a", margin: "2px 0" }} />
            <button style={menuItem} onClick={() => { onCopyDisplay(); setPopup(null); }}>
              📺 Copy display link
            </button>
            <button style={menuItem} onClick={() => { onCopyViewer(); setPopup(null); }}>
              👁 Copy viewer link
            </button>
            <div style={{ ...menuItem, cursor: "default", fontSize: 12, color: connectionColor }}>
              ● {connectionLabel}
            </div>
          </div>
        )}

        <button style={currentTool === "pen" ? iconBtnActive : iconBtn} onClick={tapPen} title="Pen">
          ✏️
        </button>
        <button style={currentTool === "eraser" ? iconBtnActive : iconBtn} onClick={tapEraser} title="Eraser">
          🧽
        </button>

        <div style={sep} />

        <button style={iconBtn} onClick={onUndo} title="Undo">
          ↩️
        </button>

        <div style={sep} />

        <button style={iconBtn} onClick={onPreviousColumn} title="Previous column">
          ◀
        </button>
        <span
          style={{
            color: "#cbd5e1",
            fontFamily: "monospace",
            fontSize: "14px",
            fontWeight: 700,
            minWidth: "38px",
            textAlign: "center",
          }}
        >
          {activeColumnIndex + 1}/{columnCount}
        </span>
        <button style={iconBtn} onClick={onNextColumn} title="Next column">
          ▶
        </button>

        <div style={sep} />

        <button style={popup === "more" ? iconBtnActive : iconBtn} onClick={tapMore} title="More">
          ⋯
        </button>
      </div>
    </>
  );
};
