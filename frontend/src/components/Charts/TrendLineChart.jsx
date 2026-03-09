/**
 * TrendLineChart.jsx
 * Monthly median price line chart with optional volume overlay.
 */
import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function TrendLineChart({ data = [], showVolume = false }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }}
          angle={-35}
          textAnchor="end"
        />
        <YAxis
          yAxisId="price"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
        />
        {showVolume && (
          <YAxis yAxisId="vol" orientation="right" tick={{ fontSize: 10 }} />
        )}
        <Tooltip formatter={(v, n) => n === "volume" ? [fmt(v), "Sales"] : [`$${fmt(v)}`, "Median Price"]} />
        {showVolume && <Legend />}
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="median_price"
          stroke="#0055A4"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#0055A4" }}
          name="Median Price"
        />
        {showVolume && (
          <Line
            yAxisId="vol"
            type="monotone"
            dataKey="volume"
            stroke="#E87722"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            name="Volume"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
