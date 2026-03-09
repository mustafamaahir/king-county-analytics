"""
pipelines/actions.py
Tab 6 — Actions
Linear regression per segment + seasonal forecast + undervalued ZIP analysis.
Answers: What should buyers, sellers, agents and investors actually do?
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score
from sklearn.cluster import KMeans


SEGMENT_NAMES = {0: "Entry-Level", 1: "Mid-Market", 2: "Premium", 3: "Luxury"}

REG_FEATURES = ["sqft_living", "grade", "condition", "bathrooms",
                "view", "waterfront", "renovated", "age"]


def _assign_segments(df: pd.DataFrame) -> pd.DataFrame:
    """Re-run clustering to assign segments (mirrors segments pipeline)."""
    cluster_features = ["price", "grade", "sqft_living", "view", "waterfront"]
    X = df[cluster_features].copy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    df = df.copy()
    df["cluster"] = kmeans.fit_predict(X_scaled)
    order = (
        df.groupby("cluster")["price"].median()
        .sort_values().index.tolist()
    )
    rank_map = {old: new for new, old in enumerate(order)}
    df["cluster"] = df["cluster"].map(rank_map)
    df["segment"] = df["cluster"].map(SEGMENT_NAMES)
    return df


def run(df: pd.DataFrame) -> dict:

    df = _assign_segments(df)

    # ── 1. Linear Regression per Segment ─────────────────────────────
    segment_regression = []
    for seg_id, seg_name in SEGMENT_NAMES.items():
        seg = df[df["cluster"] == seg_id].copy()
        if len(seg) < 30:
            continue

        X = seg[REG_FEATURES].fillna(0)
        y = seg["price"]

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        lr = LinearRegression()
        lr.fit(X_scaled, y)

        y_pred = lr.predict(X_scaled)
        r2     = round(float(r2_score(y, y_pred)), 3)

        coefs = [
            {
                "feature": feat,
                "coefficient": round(float(coef), 0),
                "direction": "positive" if coef > 0 else "negative",
            }
            for feat, coef in zip(REG_FEATURES, lr.coef_)
        ]
        coefs.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

        segment_regression.append({
            "segment":     seg_name,
            "n":           int(len(seg)),
            "r2":          r2,
            "intercept":   round(float(lr.intercept_), 0),
            "coefficients":coefs,
            "top_driver":  coefs[0]["feature"],
            "top_driver_value": coefs[0]["coefficient"],
        })

    # ── 2. Seasonal Price Forecast ────────────────────────────────────
    monthly = (
        df.groupby(df["date"].dt.to_period("M"))["price"]
        .median()
        .reset_index()
    )
    monthly.columns = ["period", "median_price"]
    monthly = monthly.sort_values("period")

    # Extend 3 months forward using linear trend
    n = len(monthly)
    x = np.arange(n)
    slope, intercept = np.polyfit(x, monthly["median_price"], 1)

    forecast_months = []
    last_period = monthly["period"].iloc[-1]
    for i in range(1, 4):
        next_period = last_period + i
        forecast_months.append({
            "month":         str(next_period),
            "forecast_price":int(intercept + slope * (n + i - 1)),
            "is_forecast":   True,
        })

    price_forecast = [
        {
            "month":         str(row["period"]),
            "median_price":  int(row["median_price"]),
            "is_forecast":   False,
        }
        for _, row in monthly.iterrows()
    ] + forecast_months

    # ── 3. Undervalued ZIP Codes ──────────────────────────────────────
    zip_stats = (
        df.groupby("zipcode").agg(
            median_price=("price", "median"),
            median_grade=("grade", "median"),
            median_sqft=("sqft_living", "median"),
            count=("price", "count"),
            price_per_sqft=("price_per_sqft", "median"),
        )
        .reset_index()
    )

    # Expected price proxy: grade × sqft (normalised)
    zip_stats["expected_score"] = (
        (zip_stats["median_grade"] / zip_stats["median_grade"].max()) * 0.6 +
        (zip_stats["median_sqft"]  / zip_stats["median_sqft"].max())  * 0.4
    )
    zip_stats["actual_score"] = (
        zip_stats["median_price"] / zip_stats["median_price"].max()
    )
    zip_stats["value_gap"] = zip_stats["expected_score"] - zip_stats["actual_score"]

    top_undervalued = (
        zip_stats[zip_stats["count"] >= 20]
        .nlargest(8, "value_gap")[
            ["zipcode", "median_price", "median_grade", "median_sqft",
             "price_per_sqft", "value_gap", "count"]
        ]
    )

    undervalued_chart = [
        {
            "zipcode":       int(row["zipcode"]),
            "median_price":  int(row["median_price"]),
            "median_grade":  round(float(row["median_grade"]), 1),
            "median_sqft":   int(row["median_sqft"]),
            "price_per_sqft":round(float(row["price_per_sqft"]), 0),
            "value_gap":     round(float(row["value_gap"]), 3),
        }
        for _, row in top_undervalued.iterrows()
    ]

    # ── 4. ROI of Renovation ─────────────────────────────────────────
    reno_comparison = (
        df.groupby("renovated")["price"]
        .agg(median="median", count="count")
        .reset_index()
    )
    reno_chart = [
        {
            "label":        "Renovated" if int(row["renovated"]) == 1 else "Not Renovated",
            "median_price": int(row["median"]),
            "count":        int(row["count"]),
        }
        for _, row in reno_comparison.iterrows()
    ]
    reno_premium = int(
        df[df["renovated"] == 1]["price"].median() -
        df[df["renovated"] == 0]["price"].median()
    )

    # ── 5. Price Predictor Ranges per Segment ────────────────────────
    # Useful for the "estimated price" action card
    price_ranges = {
        seg["segment"]: {
            "p25": int(df[df["segment"] == seg["segment"]]["price"].quantile(0.25)),
            "p50": int(df[df["segment"] == seg["segment"]]["price"].quantile(0.50)),
            "p75": int(df[df["segment"] == seg["segment"]]["price"].quantile(0.75)),
        }
        for seg in segment_regression
    }

    # ── Groq context ──────────────────────────────────────────────────
    top_zip = undervalued_chart[0] if undervalued_chart else {}
    forecast_3m = forecast_months[-1]["forecast_price"] if forecast_months else None
    current_median = int(monthly["median_price"].iloc[-1])

    groq_context = {
        "reno_premium":         reno_premium,
        "top_undervalued_zip":  top_zip.get("zipcode"),
        "top_zip_price_psf":    top_zip.get("price_per_sqft"),
        "forecast_3m_price":    forecast_3m,
        "current_median":       current_median,
        "forecast_change_pct":  round((forecast_3m - current_median) / current_median * 100, 1)
                                if forecast_3m else None,
        "entry_top_driver":     next(
            (s["top_driver"] for s in segment_regression
             if s["segment"] == "Entry-Level"), None
        ),
        "luxury_top_driver":    next(
            (s["top_driver"] for s in segment_regression
             if s["segment"] == "Luxury"), None
        ),
    }

    return {
        "segment_regression":  segment_regression,
        "price_forecast":      price_forecast,
        "undervalued_chart":   undervalued_chart,
        "reno_chart":          reno_chart,
        "reno_premium":        reno_premium,
        "price_ranges":        price_ranges,
        "groq_context":        groq_context,
    }
