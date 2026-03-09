import React from "react";

export default function LoadingState({ tab }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "50vh", gap: 20,
    }}>
      <div style={{
        width: 40, height: 40, border: "3px solid #DDD9D0",
        borderTop: "3px solid #0055A4", borderRadius: "50%",
        animation: "spin 0.9s linear infinite",
      }} />
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.72rem",
        letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280",
      }}>
        Loading {tab} data…
      </div>
      <div style={{ fontSize: "0.78rem", color: "#6B7280", maxWidth: 320, textAlign: "center" }}>
        If this is the first visit in a while, the server may be waking up — usually takes 20–40 seconds.
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
      `}</style>
    </div>
  );
}
