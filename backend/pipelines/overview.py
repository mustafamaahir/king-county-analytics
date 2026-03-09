"""
pipelines/overview.py
Tab 2 — Overview
Computes descriptive statistics and distributions.
Answers: What does the King County housing market look like at a glance?
"""

import pandas as pd
import numpy as np


def run(df: pd.DataFrame) -> dict:
    """
    Returns all data needed by the Overview tab.
    No ML — pure descriptive statistics.
    """

    # ── KPI Cards ───────────────────────────────────────────────────
    kpis = {
        "total_properties":  int(len(df)),
        "median_price":      int(df["price"].median()),
        "mean_price":        int(df["price"].mean()),
        "max_price":         int(df["price"].max()),
        "min_price":         int(df["price"].min()),
        "median_sqft":       int(df["sqft_living"].median()),
        "waterfront_count":  int(df["waterfront"].sum()),
        "renovated_count":   int(df["renovated"].sum()),
        "date_range_start":  df["date"].min().strftime("%b %Y"),
        "date_range_end":    df["date"].max().strftime("%b %Y"),
    }

    # ── Price Distribution (histogram buckets) ───────────────────────
    # 12 equal-width bins — sent to frontend as chart-ready data
    price_counts, price_edges = np.histogram(df["price"], bins=12)
    price_distribution = [
        {
            "range": f"${int(price_edges[i]/1000)}K–${int(price_edges[i+1]/1000)}K",
            "count": int(price_counts[i]),
        }
        for i in range(len(price_counts))
    ]

    # ── Grade vs Median Price ────────────────────────────────────────
    grade_price = (
        df.groupby("grade")["price"]
        .agg(median_price="median", count="count")
        .reset_index()
        .rename(columns={"grade": "grade"})
    )
    grade_chart = [
        {
            "grade":        int(row["grade"]),
            "median_price": int(row["median_price"]),
            "count":        int(row["count"]),
        }
        for _, row in grade_price.iterrows()
    ]

    # ── Bedroom Distribution ─────────────────────────────────────────
    bedroom_dist = (
        df["bedrooms"].value_counts().sort_index()
    )
    bedroom_chart = [
        {"bedrooms": int(k), "count": int(v)}
        for k, v in bedroom_dist.items()
        if k <= 10  # cap display at 10 bedrooms
    ]

    # ── Year Built Distribution ──────────────────────────────────────
    decade_bins  = list(range(1890, 2030, 10))
    decade_labels = [f"{d}s" for d in decade_bins[:-1]]
    df["decade"] = pd.cut(df["yr_built"], bins=decade_bins, labels=decade_labels)
    decade_dist = df["decade"].value_counts().sort_index()
    decade_chart = [
        {"decade": str(k), "count": int(v)}
        for k, v in decade_dist.items()
    ]

    # ── Condition Breakdown ──────────────────────────────────────────
    condition_dist = (
        df.groupby(["condition", "condition_label"])["price"]
        .agg(count="count", median_price="median")
        .reset_index()
    )
    condition_chart = [
        {
            "condition":    int(row["condition"]),
            "label":        row["condition_label"],
            "count":        int(row["count"]),
            "median_price": int(row["median_price"]),
        }
        for _, row in condition_dist.iterrows()
    ]

    # ── Summary stats passed to Groq ─────────────────────────────────
    groq_context = {
        "total_properties":  kpis["total_properties"],
        "median_price":      kpis["median_price"],
        "price_range":       f"${kpis['min_price']:,} – ${kpis['max_price']:,}",
        "median_sqft":       kpis["median_sqft"],
        "waterfront_pct":    round(kpis["waterfront_count"] / len(df) * 100, 1),
        "renovated_pct":     round(kpis["renovated_count"] / len(df) * 100, 1),
        "top_grade_median":  int(df[df["grade"] >= 11]["price"].median()),
        "date_range":        f"{kpis['date_range_start']} to {kpis['date_range_end']}",
    }

    return {
        "kpis":                kpis,
        "price_distribution":  price_distribution,
        "grade_chart":         grade_chart,
        "bedroom_chart":       bedroom_chart,
        "decade_chart":        decade_chart,
        "condition_chart":     condition_chart,
        "groq_context":        groq_context,
    }
