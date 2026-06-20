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
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        background:
          "radial-gradient(120% 120% at 50% 0%, #1b2230 0%, #0d1016 60%, #0a0c10 100%)",
        color: "#eee",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#141a24",
          border: "1px solid #232b38",
          borderRadius: "20px",
          padding: "48px 40px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: "3.2rem", lineHeight: 1, marginBottom: "20px" }}>
          📋
        </div>

        <h1 style={{ fontSize: "2.4rem", fontWeight: 700, margin: 0 }}>
          Column Board
        </h1>

        <p
          style={{
            color: "#8b95a5",
            fontSize: "1rem",
            margin: "14px 0 32px",
          }}
        >
          Portrait writing pad → 16:9 classroom projector
        </p>

        <button
          onClick={startRoom}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "16px 32px",
            fontSize: "1.05rem",
            fontFamily: "system-ui, sans-serif",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 6px 20px rgba(59,130,246,0.35)",
          }}
        >
          Create New Room
        </button>

        <a
          href="/prototype"
          style={{
            marginTop: "22px",
            color: "#8b95a5",
            fontSize: "0.9rem",
            textDecoration: "underline",
          }}
        >
          Local prototype (no realtime)
        </a>
      </div>
    </div>
  );
};
