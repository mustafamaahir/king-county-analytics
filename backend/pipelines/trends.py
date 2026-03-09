"""
pipelines/trends.py
Tab 3 — Trends
Time-series analysis of price and volume across the observation window.
Answers: How did the King County market move between May 2014 and May 2015?
"""

import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import STL


def run(df: pd.DataFrame) -> dict:

    # ── Monthly aggregation ──────────────────────────────────────────
    monthly = (
        df.groupby(df["date"].dt.to_period("M"))
        .agg(
            median_price=("price", "median"),
            mean_price=("price", "mean"),
            volume=("price", "count"),
            median_sqft=("sqft_living", "median"),
        )
        .reset_index()
    )
    monthly["month_str"] = monthly["date"].dt.strftime("%b %Y")
    monthly = monthly.sort_values("date")

    monthly_chart = [
        {
            "month":        row["month_str"],
            "median_price": int(row["median_price"]),
            "mean_price":   int(row["mean_price"]),
            "volume":       int(row["volume"]),
            "median_sqft":  int(row["median_sqft"]),
        }
        for _, row in monthly.iterrows()
    ]

    # ── Waterfront vs Non-waterfront monthly median ──────────────────
    wf_monthly = (
        df.groupby([df["date"].dt.to_period("M"), "waterfront_label"])["price"]
        .median()
        .reset_index()
    )
    wf_monthly.columns = ["date", "waterfront", "median_price"]
    wf_monthly["month_str"] = wf_monthly["date"].dt.strftime("%b %Y")
    wf_monthly = wf_monthly.sort_values("date")

    waterfront_chart = [
        {
            "month":        row["month_str"],
            "type":         row["waterfront"],
            "median_price": int(row["median_price"]),
        }
        for _, row in wf_monthly.iterrows()
    ]

    # ── STL Seasonal Decomposition ───────────────────────────────────
    # Requires at least 2 full cycles — use weekly aggregation
    weekly = (
        df.groupby(df["date"].dt.to_period("W"))["price"]
        .median()
        .reset_index()
    )
    weekly.columns = ["week", "median_price"]
    weekly = weekly.sort_values("week")
    weekly["median_price"] = weekly["median_price"].interpolate()

    decomposition_chart = []
    seasonal_variance_pct = None

    if len(weekly) >= 14:
        try:
            stl = STL(weekly["median_price"], period=4, robust=True)
            result = stl.fit()
            seasonal_variance_pct = round(
                float(np.var(result.seasonal) / np.var(weekly["median_price"]) * 100), 1
            )
            for i, row in weekly.iterrows():
                decomposition_chart.append({
                    "week":     str(row["week"]),
                    "actual":   round(float(row["median_price"]), 0),
                    "trend":    round(float(result.trend.iloc[i - weekly.index[0]]), 0),
                    "seasonal": round(float(result.seasonal.iloc[i - weekly.index[0]]), 0),
                })
        except Exception:
            seasonal_variance_pct = None

    # ── Price by Month-of-Year (seasonal pattern) ────────────────────
    seasonal_pattern = (
        df.groupby("month")["price"]
        .median()
        .reset_index()
    )
    month_names = {
        1:"Jan", 2:"Feb", 3:"Mar", 4:"Apr", 5:"May", 6:"Jun",
        7:"Jul", 8:"Aug", 9:"Sep", 10:"Oct", 11:"Nov", 12:"Dec"
    }
    seasonal_chart = [
        {
            "month":        month_names[int(row["month"])],
            "median_price": int(row["price"]),
        }
        for _, row in seasonal_pattern.iterrows()
    ]

    # ── Best month to buy / sell ─────────────────────────────────────
    cheapest_month = seasonal_pattern.loc[seasonal_pattern["price"].idxmin()]
    priciest_month = seasonal_pattern.loc[seasonal_pattern["price"].idxmax()]

    # ── Groq context ─────────────────────────────────────────────────
    first_month_price = monthly["median_price"].iloc[0]
    last_month_price  = monthly["median_price"].iloc[-1]
    pct_change = round((last_month_price - first_month_price) / first_month_price * 100, 1)

    groq_context = {
        "observation_window":   f"{monthly['month_str'].iloc[0]} to {monthly['month_str'].iloc[-1]}",
        "price_change_pct":     pct_change,
        "peak_volume_month":    monthly.loc[monthly["volume"].idxmax(), "month_str"],
        "seasonal_variance_pct": seasonal_variance_pct,
        "cheapest_month":       month_names[int(cheapest_month["month"])],
        "priciest_month":       month_names[int(priciest_month["month"])],
        "waterfront_premium":   int(
            df[df["waterfront"] == 1]["price"].median() -
            df[df["waterfront"] == 0]["price"].median()
        ),
    }

    return {
        "monthly_chart":       monthly_chart,
        "waterfront_chart":    waterfront_chart,
        "decomposition_chart": decomposition_chart,
        "seasonal_chart":      seasonal_chart,
        "groq_context":        groq_context,
    }
