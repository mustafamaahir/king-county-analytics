"""
pipelines/segments.py
Tab 4 — Segments
K-Means clustering to discover natural property tiers in the market.
Answers: Is this one market, or several distinct segments with different dynamics?
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score


SEGMENT_NAMES = {
    0: "Entry-Level",
    1: "Mid-Market",
    2: "Premium",
    3: "Luxury",
}

SEGMENT_COLORS = {
    "Entry-Level": "#0055A4",
    "Mid-Market":  "#E87722",
    "Premium":     "#007E8A",
    "Luxury":      "#C82AB3",
}


def run(df: pd.DataFrame) -> dict:

    # ── Features for clustering ──────────────────────────────────────
    cluster_features = ["price", "grade", "sqft_living", "view", "waterfront"]
    X = df[cluster_features].copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── Elbow method — find optimal K ────────────────────────────────
    inertia_values = []
    k_range = range(2, 9)
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X_scaled)
        inertia_values.append(int(km.inertia_))

    elbow_chart = [
        {"k": int(k), "inertia": inertia}
        for k, inertia in zip(k_range, inertia_values)
    ]

    # ── Fit final model with K=4 ─────────────────────────────────────
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    df = df.copy()
    df["cluster"] = kmeans.fit_predict(X_scaled)

    # ── Order clusters by median price so labels are consistent ──────
    cluster_order = (
        df.groupby("cluster")["price"]
        .median()
        .sort_values()
        .index.tolist()
    )
    rank_map = {old: new for new, old in enumerate(cluster_order)}
    df["cluster"] = df["cluster"].map(rank_map)
    df["segment"] = df["cluster"].map(SEGMENT_NAMES)

    # ── Silhouette score ─────────────────────────────────────────────
    sil_score = round(float(silhouette_score(X_scaled, df["cluster"], sample_size=3000)), 3)

    # ── Segment profiles ─────────────────────────────────────────────
    segment_profiles = []
    for seg_id, seg_name in SEGMENT_NAMES.items():
        seg = df[df["cluster"] == seg_id]
        segment_profiles.append({
            "id":              seg_id,
            "name":            seg_name,
            "color":           SEGMENT_COLORS[seg_name],
            "count":           int(len(seg)),
            "share_pct":       round(len(seg) / len(df) * 100, 1),
            "median_price":    int(seg["price"].median()),
            "median_sqft":     int(seg["sqft_living"].median()),
            "median_grade":    round(float(seg["grade"].median()), 1),
            "waterfront_pct":  round(float(seg["waterfront"].mean() * 100), 1),
            "median_price_psf":round(float(seg["price_per_sqft"].median()), 0),
        })

    # ── Scatter plot data (sample 1500 for performance) ──────────────
    sample = df.sample(n=min(1500, len(df)), random_state=42)
    scatter_data = [
        {
            "sqft_living": int(row["sqft_living"]),
            "price":       int(row["price"]),
            "segment":     row["segment"],
            "grade":       int(row["grade"]),
            "color":       SEGMENT_COLORS[row["segment"]],
        }
        for _, row in sample.iterrows()
    ]

    # ── Grade distribution per segment ───────────────────────────────
    grade_segment = (
        df.groupby(["segment", "grade"])
        .size()
        .reset_index(name="count")
    )
    grade_segment_chart = [
        {
            "segment": row["segment"],
            "grade":   int(row["grade"]),
            "count":   int(row["count"]),
        }
        for _, row in grade_segment.iterrows()
    ]

    # ── Groq context ─────────────────────────────────────────────────
    luxury   = next(s for s in segment_profiles if s["name"] == "Luxury")
    entry    = next(s for s in segment_profiles if s["name"] == "Entry-Level")
    mid      = next(s for s in segment_profiles if s["name"] == "Mid-Market")
    premium  = next(s for s in segment_profiles if s["name"] == "Premium")

    groq_context = {
        "silhouette_score":         sil_score,
        "n_clusters":               4,
        "entry_share_pct":          entry["share_pct"],
        "mid_share_pct":            mid["share_pct"],
        "premium_share_pct":        premium["share_pct"],
        "luxury_share_pct":         luxury["share_pct"],
        "luxury_median_price":      luxury["median_price"],
        "entry_median_price":       entry["median_price"],
        "luxury_waterfront_pct":    luxury["waterfront_pct"],
        "price_range_entry_luxury": f"${entry['median_price']:,} to ${luxury['median_price']:,}",
    }

    return {
        "segment_profiles":    segment_profiles,
        "scatter_data":        scatter_data,
        "grade_segment_chart": grade_segment_chart,
        "elbow_chart":         elbow_chart,
        "silhouette_score":    sil_score,
        "groq_context":        groq_context,
    }
