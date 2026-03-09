/**
 * SegmentScatter.jsx
 * Scatter plot of sqft_living vs price, coloured by market segment.
 */
import React from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function SegmentScatter({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
        <XAxis
          type="number"
          dataKey="sqft_living"
          name="Living Area"
          unit=" sqft"
          tick={{ fontSize: 10 }}
          label={{ value: "Living Area (sqft)", position: "insideBottom", offset: -10, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="price"
          name="Price"
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(v, n) =>
            n === "price"
              ? [`$${fmt(v)}`, "Price"]
              : [`${fmt(v)} sqft`, "Living Area"]
          }
        />
        <Scatter data={data} fill="#0055A4">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} opacity={0.55} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
