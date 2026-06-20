import React from "react";

interface Props {
  info: Record<string, unknown>;
  visible?: boolean;
}

export const DebugPanel: React.FC<Props> = ({ info, visible = true }) => {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        background: "rgba(0,0,0,0.88)",
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: "11px",
        padding: "8px 10px",
        borderRadius: "6px",
        zIndex: 9999,
        lineHeight: "1.6",
        maxWidth: "220px",
        pointerEvents: "none",
      }}
    >
      {Object.entries(info).map(([k, v]) => (
        <div key={k}>
          <span style={{ color: "#888" }}>{k}: </span>
          {typeof v === "number" ? v.toFixed(2) : String(v)}
        </div>
      ))}
    </div>
  );
};
