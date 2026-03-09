import React from "react";

const ACCENT = { blue: "#0055A4", amber: "#E87722", teal: "#007E8A", gold: "#C89B2A" };

export default function KPICard({ label, value, sub, accent = "blue" }) {
  const color = ACCENT[accent] || ACCENT.blue;
  return (
    <div style={{
      background: "#fff", border: "1px solid #DDD9D0",
      borderTop: `3px solid ${color}`, padding: "20px 18px",
    }}>
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.6rem",
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: "#6B7280", marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Libre Baskerville',serif",
        fontSize: "1.7rem", fontWeight: 700, color, lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: 5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
