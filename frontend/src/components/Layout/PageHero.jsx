import React from "react";

export default function PageHero({ chapter, title, titleEm, subtitle }) {
  return (
    <div style={{
      background: "#0055A4", padding: "52px 0 44px", position: "relative", overflow: "hidden",
    }}>
      {/* diagonal pattern overlay */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 380,
        backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 12px)",
        pointerEvents: "none",
      }} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.68rem",
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ width: 24, height: 1, background: "rgba(255,255,255,0.4)", display: "inline-block" }} />
          {chapter}
        </div>
        <h1 style={{
          fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "#fff", marginBottom: 14,
        }}>
          {title}{" "}
          {titleEm && (
            <em style={{ fontStyle: "italic", color: "rgba(255,220,100,1)" }}>
              {titleEm}
            </em>
          )}
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.75)", fontSize: "0.92rem",
          maxWidth: 580, lineHeight: 1.75,
        }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
