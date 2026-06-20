import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const StartPage: React.FC = () => {
  const navigate = useNavigate();

  const startRoom = useCallback(() => {
    const roomId = crypto.randomUUID();
    navigate(`/write/${roomId}`);
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#1a1a1a",
        color: "#eee",
        fontFamily: "system-ui, sans-serif",
        gap: "24px",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0 }}>Column Board</h1>
      <p
        style={{
          color: "#888",
          fontSize: "1.1rem",
          margin: 0,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        Portrait-first teacher writing pad with 16:9 classroom board rendering.
      </p>
      <button
        onClick={startRoom}
        style={{
          padding: "14px 32px",
          fontSize: "1.1rem",
          fontFamily: "monospace",
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Start New Room
      </button>
      <a href="/prototype" style={{ color: "#60a5fa", fontSize: "0.9rem" }}>
        Open local prototype (no realtime)
      </a>
    </div>
  );
};
