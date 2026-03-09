/**
 * ForecastChart.jsx
 * Line chart showing historical prices + 3-month forecast.
 * Dashed line marks the forecast window.
 */
import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function ForecastChart({ data = [] }) {
  const forecastStart = data.find((d) => d.is_forecast);

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
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip formatter={(v) => [`$${fmt(v)}`, "Median Price"]} />
        {forecastStart && (
          <ReferenceLine
            x={forecastStart.month}
            stroke="#E87722"
            strokeDasharray="4 3"
            label={{ value: "Forecast →", position: "insideTopRight", fontSize: 10, fill: "#E87722" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="median_price"
          stroke="#0055A4"
          strokeWidth={2.5}
          dot={false}
          connectNulls
          name="Historical"
        />
        <Line
          type="monotone"
          dataKey="forecast_price"
          stroke="#E87722"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 4, fill: "#E87722" }}
          connectNulls
          name="Forecast"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
