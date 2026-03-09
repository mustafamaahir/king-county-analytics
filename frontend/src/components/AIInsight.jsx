import React from "react";

export default function AIInsight({ text, loading }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #DDD9D0",
      borderLeft: "4px solid #007E8A", padding: "24px 28px", marginTop: 24,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.62rem",
        letterSpacing: "0.15em", textTransform: "uppercase",
        color: "#007E8A", marginBottom: 12,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%", background: "#007E8A",
          animation: "pulse 2s infinite",
        }} />
        Groq AI · Analysis
      </div>
      {loading ? (
        <div style={{ color: "#6B7280", fontSize: "0.85rem", fontStyle: "italic" }}>
          Generating interpretation…
        </div>
      ) : (
        <p style={{
          fontSize: "0.875rem", color: "#2C3240", lineHeight: 1.8,
        }}>
          {text || "No interpretation available."}
        </p>
      )}
    </div>
  );
}
