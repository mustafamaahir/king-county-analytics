/**
 * GradeBarChart.jsx
 * Bar chart mapping build quality grade to median sale price.
 */
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function GradeBarChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
        <XAxis
          dataKey="grade"
          tick={{ fontSize: 10 }}
          label={{ value: "Grade (1–13)", position: "insideBottom", offset: -2, fontSize: 10 }}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip formatter={(v) => [`$${fmt(v)}`, "Median Price"]} />
        <Bar dataKey="median_price" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.grade >= 11 ? "#C89B2A" :
                entry.grade >= 9  ? "#007E8A" :
                entry.grade >= 7  ? "#0055A4" : "#C8C4BA"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
