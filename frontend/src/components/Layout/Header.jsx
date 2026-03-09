import React from "react";

const TABS = [
  { id: "problem",  label: "Problem Statement" },
  { id: "overview", label: "Market Overview"   },
  { id: "trends",   label: "Price Trends"      },
  { id: "segments", label: "Market Segments"   },
  { id: "drivers",  label: "Price Drivers"     },
  { id: "actions",  label: "Actions"           },
];

const styles = {
  header: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
    background: "#fff",
    borderBottom: "2px solid #0055A4",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 40px", height: 60,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  logo: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: "1rem", color: "#2C3240",
    textDecoration: "none", letterSpacing: "-0.01em",
    flexShrink: 0,
  },
  logoSpan: { color: "#0055A4" },
  nav: { display: "flex", gap: 0, overflowX: "auto" },
  tab: (active) => ({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.67rem", letterSpacing: "0.04em", textTransform: "uppercase",
    color: active ? "#0055A4" : "#6B7280",
    background: "none", border: "none",
    borderBottom: active ? "2px solid #0055A4" : "2px solid transparent",
    padding: "0 16px", height: 60, cursor: "pointer",
    whiteSpace: "nowrap", fontWeight: active ? 500 : 400,
    transition: "all 0.15s",
    marginBottom: "-2px",
  }),
  badge: {
    display: "flex", alignItems: "center", gap: 7,
    fontSize: "0.65rem", fontFamily: "'IBM Plex Mono', monospace",
    color: "#6B7280", border: "1px solid #DDD9D0",
    padding: "5px 12px", background: "#F7F6F2", flexShrink: 0,
  },
  dot: {
    width: 7, height: 7, borderRadius: "50%", background: "#007E8A",
    animation: "pulse 2s infinite",
  },
};

export default function Header({ activeTab, onTabChange }) {
  return (
    <header style={styles.header}>
      <span style={styles.logo}>
        King County <span style={styles.logoSpan}>Housing Analytics</span>
      </span>
      <nav style={styles.nav}>
        {TABS.map((t) => (
          <button
            key={t.id}
            style={styles.tab(activeTab === t.id)}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div style={styles.badge}>
        <div style={styles.dot} />
        Groq AI · Live
      </div>
    </header>
  );
}
