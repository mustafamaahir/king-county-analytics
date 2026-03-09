import React from "react";

export default function ContinuationBanner({ from, message }) {
  return (
    <div style={{ background: "#E87722", padding: "10px 0" }}>
      <div className="container" style={{
        display: "flex", alignItems: "center", gap: 10,
        fontSize: "0.78rem", color: "#fff", fontWeight: 500,
      }}>
        <span style={{ fontSize: "1rem" }}>←</span>
        Continuing from <strong style={{ marginLeft: 4 }}>{from}</strong>
        {message && <span style={{ opacity: 0.9 }}>: {message}</span>}
      </div>
    </div>
  );
}
