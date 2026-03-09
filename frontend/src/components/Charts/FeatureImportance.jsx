/**
 * FeatureImportance.jsx
 * Horizontal bar chart for Random Forest feature importance scores.
 */
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

export default function FeatureImportance({ data = [] }) {
  const top8 = data.slice(0, 8);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={top8}
        layout="vertical"
        margin={{ top: 5, right: 60, left: 160, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fontFamily: "IBM Plex Sans" }}
          width={155}
        />
        <Tooltip formatter={(v) => [`${(v * 100).toFixed(1)}%`, "Importance"]} />
        <Bar dataKey="importance" radius={[0, 2, 2, 0]}>
          {top8.map((_, i) => (
            <Cell
              key={i}
              fill={
                i === 0 ? "#0055A4" :
                i === 1 ? "#007E8A" :
                i === 2 ? "#E87722" : "#C8C4BA"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
