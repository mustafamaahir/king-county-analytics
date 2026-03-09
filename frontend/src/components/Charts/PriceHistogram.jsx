/**
 * PriceHistogram.jsx
 * Reusable bar chart for price distribution.
 * Receives data from Overview pipeline.
 */
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function PriceHistogram({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
        <XAxis
          dataKey="range"
          tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v) => [fmt(v), "Properties"]} />
        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i < 4 ? "#0055A4" : i < 8 ? "#007E8A" : "#E87722"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
