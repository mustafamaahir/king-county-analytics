/**
 * NeighbourhoodMap.jsx
 * Static SVG heatmap of King County neighbourhoods.
 * Dots are positioned by real lat/lon, coloured by value gap score.
 * pure SVG rendering.
 */
import React, { useState } from "react";

// King County bounding box
const MAP = {
  latMin:  47.15,
  latMax:  47.85,
  lonMin: -122.55,
  lonMax: -121.90,
  width:   600,
  height:  420,
};

function latToY(lat) {
  return MAP.height - ((lat - MAP.latMin) / (MAP.latMax - MAP.latMin)) * MAP.height;
}
function lonToX(lon) {
  return ((lon - MAP.lonMin) / (MAP.lonMax - MAP.lonMin)) * MAP.width;
}

// Colour scale: blue (overvalued) → grey (neutral) → gold (undervalued)
function valueGapColor(gap, maxGap) {
  if (gap === undefined || maxGap === 0) return "#C8C4BA";
  const norm = Math.max(-1, Math.min(1, gap / maxGap));
  if (norm > 0) {
    // undervalued — interpolate grey to gold
    const r = Math.round(200 + norm * (200 - 200));
    const g = Math.round(196 + norm * (155 - 196));
    const b = Math.round(186 + norm * (42  - 186));
    return `rgb(${Math.round(200 - norm*0)},${Math.round(196 - norm*41)},${Math.round(186 - norm*144)})`;
  } else {
    // overvalued — interpolate grey to blue
    const t = -norm;
    return `rgb(${Math.round(200 - t*200)},${Math.round(196 - t*111)},${Math.round(186 + t*18)})`;
  }
}

export default function NeighbourhoodMap({ allAreas = [], topAreas = [] }) {
  const [hovered, setHovered] = useState(null);

  const maxGap = Math.max(...allAreas.map(a => Math.abs(a.value_gap)), 0.01);
  const topNames = new Set(topAreas.map(a => a.neighbourhood));

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${MAP.width} ${MAP.height}`}
        style={{ width: "100%", height: "auto", background: "#F0EEE8", borderRadius: 4 }}
      >
        {/* ── Grid lines ── */}
        {[47.3, 47.4, 47.5, 47.6, 47.7, 47.8].map(lat => (
          <line key={lat}
            x1={0} y1={latToY(lat)} x2={MAP.width} y2={latToY(lat)}
            stroke="#DDD9D0" strokeWidth={0.5}
          />
        ))}
        {[-122.5, -122.4, -122.3, -122.2, -122.1, -122.0].map(lon => (
          <line key={lon}
            x1={lonToX(lon)} y1={0} x2={lonToX(lon)} y2={MAP.height}
            stroke="#DDD9D0" strokeWidth={0.5}
          />
        ))}

        {/* ── Water body (Lake Washington rough outline) ── */}
        <ellipse cx={lonToX(-122.24)} cy={latToY(47.58)} rx={18} ry={55}
          fill="#C8D8E8" opacity={0.6} />

        {/* ── Puget Sound (left edge) ── */}
        <rect x={0} y={0} width={lonToX(-122.44)} height={MAP.height}
          fill="#C8D8E8" opacity={0.3} />

        {/* ── All neighbourhood dots ── */}
        {allAreas.map((area) => {
          const x   = lonToX(area.lon);
          const y   = latToY(area.lat);
          const isTop  = topNames.has(area.neighbourhood);
          const color  = isTop ? "#C89B2A" : valueGapColor(area.value_gap, maxGap);
          const radius = isTop ? 10 : 6;
          return (
            <g key={area.neighbourhood}
              onMouseEnter={() => setHovered(area)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {isTop && (
                <circle cx={x} cy={y} r={radius + 5}
                  fill="#C89B2A" opacity={0.25} />
              )}
              <circle cx={x} cy={y} r={radius}
                fill={color}
                stroke={isTop ? "#8B6914" : "#fff"}
                strokeWidth={isTop ? 2 : 1}
                opacity={0.9}
              />
              {isTop && (
                <text x={x + radius + 3} y={y + 4}
                  fontSize={9} fill="#2C3240"
                  fontFamily="IBM Plex Sans"
                  style={{ pointerEvents: "none" }}
                >
                  {area.neighbourhood}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Compass ── */}
        <text x={MAP.width - 20} y={20} fontSize={12} fill="#6B7280"
          fontFamily="IBM Plex Sans" textAnchor="middle">N</text>
        <line x1={MAP.width - 20} y1={24} x2={MAP.width - 20} y2={36}
          stroke="#6B7280" strokeWidth={1} />

        {/* ── Labels ── */}
        <text x={8} y={MAP.height - 8} fontSize={8} fill="#6B7280"
          fontFamily="IBM Plex Mono">
          {MAP.latMin}°N
        </text>
        <text x={8} y={14} fontSize={8} fill="#6B7280"
          fontFamily="IBM Plex Mono">
          {MAP.latMax}°N
        </text>
      </svg>

      {/* ── Tooltip ── */}
      {hovered && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "#fff", border: "1px solid #DDD9D0",
          borderLeft: `4px solid ${topNames.has(hovered.neighbourhood) ? "#C89B2A" : "#0055A4"}`,
          padding: "12px 16px", minWidth: 200, pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C3240", marginBottom: 6 }}>
            {hovered.neighbourhood}
            {topNames.has(hovered.neighbourhood) && (
              <span style={{ marginLeft: 6, fontSize: "0.6rem", background: "#C89B2A", color: "#fff", padding: "2px 6px" }}>
                TOP PICK
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280", lineHeight: 1.8 }}>
            <div>Median price: <strong style={{ color: "#2C3240" }}>${hovered.median_price?.toLocaleString()}</strong></div>
            <div>Price / sqft: <strong style={{ color: "#2C3240" }}>${hovered.price_per_sqft}</strong></div>
            <div>Value gap: <strong style={{ color: hovered.value_gap > 0 ? "#C89B2A" : "#0055A4" }}>
              {hovered.value_gap > 0 ? "▲ Undervalued" : "▼ Overvalued"}
            </strong></div>
            <div>Properties: <strong style={{ color: "#2C3240" }}>{hovered.count}</strong></div>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#6B7280" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#C89B2A", border: "2px solid #8B6914" }} />
          Top undervalued area (hover for details)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#6B7280" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#C8C4BA" }} />
          Other areas
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#6B7280" }}>
          <div style={{ width: 20, height: 10, background: "#C8D8E8", opacity: 0.8 }} />
          Water
        </div>
      </div>
    </div>
  );
}
