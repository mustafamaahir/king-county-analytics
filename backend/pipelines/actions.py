"""
pipelines/actions.py
Tab 6 — Actions
Linear regression per segment + seasonal forecast + undervalued AREA analysis.
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

# ── King County neighbourhood map ────────────────────────────────────
# Defined by lat/lon bounding boxes for major areas, plus a fallback to assign any coordinate to the nearest area centroid.
NEIGHBOURHOODS = [
    {"name": "Downtown Seattle",   "lat_min": 47.59, "lat_max": 47.62, "lon_min": -122.36, "lon_max": -122.30},
    {"name": "Capitol Hill",       "lat_min": 47.62, "lat_max": 47.65, "lon_min": -122.33, "lon_max": -122.30},
    {"name": "Bellevue",           "lat_min": 47.57, "lat_max": 47.63, "lon_min": -122.22, "lon_max": -122.14},
    {"name": "Kirkland",           "lat_min": 47.66, "lat_max": 47.72, "lon_min": -122.22, "lon_max": -122.17},
    {"name": "Redmond",            "lat_min": 47.66, "lat_max": 47.72, "lon_min": -122.14, "lon_max": -122.08},
    {"name": "Mercer Island",      "lat_min": 47.55, "lat_max": 47.60, "lon_min": -122.25, "lon_max": -122.21},
    {"name": "Renton",             "lat_min": 47.46, "lat_max": 47.52, "lon_min": -122.24, "lon_max": -122.17},
    {"name": "Kent",               "lat_min": 47.37, "lat_max": 47.43, "lon_min": -122.25, "lon_max": -122.18},
    {"name": "Federal Way",        "lat_min": 47.29, "lat_max": 47.35, "lon_min": -122.36, "lon_max": -122.28},
    {"name": "Auburn",             "lat_min": 47.29, "lat_max": 47.35, "lon_min": -122.25, "lon_max": -122.18},
    {"name": "North Seattle",      "lat_min": 47.68, "lat_max": 47.74, "lon_min": -122.38, "lon_max": -122.28},
    {"name": "Shoreline",          "lat_min": 47.74, "lat_max": 47.79, "lon_min": -122.38, "lon_max": -122.32},
    {"name": "Burien",             "lat_min": 47.45, "lat_max": 47.50, "lon_min": -122.36, "lon_max": -122.30},
    {"name": "SeaTac",             "lat_min": 47.41, "lat_max": 47.46, "lon_min": -122.33, "lon_max": -122.27},
    {"name": "Issaquah",           "lat_min": 47.52, "lat_max": 47.57, "lon_min": -122.08, "lon_max": -122.02},
    {"name": "Sammamish",          "lat_min": 47.60, "lat_max": 47.66, "lon_min": -122.08, "lon_max": -122.02},
    {"name": "West Seattle",       "lat_min": 47.52, "lat_max": 47.58, "lon_min": -122.43, "lon_max": -122.36},
    {"name": "Beacon Hill",        "lat_min": 47.55, "lat_max": 47.59, "lon_min": -122.33, "lon_max": -122.29},
    {"name": "Maple Valley",       "lat_min": 47.36, "lat_max": 47.42, "lon_min": -122.08, "lon_max": -122.02},
    {"name": "Woodinville",        "lat_min": 47.74, "lat_max": 47.79, "lon_min": -122.18, "lon_max": -122.12},
]


def _assign_neighbourhood(lat, lon):
    """Map a lat/lon coordinate to the nearest named neighbourhood."""
    for n in NEIGHBOURHOODS:
        if n["lat_min"] <= lat <= n["lat_max"] and n["lon_min"] <= lon <= n["lon_max"]:
            return n["name"]
    # Fallback: find closest neighbourhood centroid
    best, best_dist = "Other", float("inf")
    for n in NEIGHBOURHOODS:
        clat = (n["lat_min"] + n["lat_max"]) / 2
        clon = (n["lon_min"] + n["lon_max"]) / 2
        dist = (lat - clat) ** 2 + (lon - clon) ** 2
        if dist < best_dist:
            best_dist = dist
            best = n["name"]
    return best


def _assign_segments(df: pd.DataFrame) -> pd.DataFrame:
    """Re-run clustering to assign segments."""
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

    # ── 1. Assign neighbourhoods ──────────────────────────────────────
    df = df.copy()
    df["neighbourhood"] = df.apply(
        lambda r: _assign_neighbourhood(r["lat"], r["long"]), axis=1
    )

    # ── 2. Neighbourhood value gap analysis ───────────────────────────
    area_stats = (
        df.groupby("neighbourhood").agg(
            median_price       = ("price",         "median"),
            median_grade       = ("grade",         "median"),
            median_sqft        = ("sqft_living",   "median"),
            count              = ("price",         "count"),
            price_per_sqft     = ("price_per_sqft","median"),
            waterfront_pct     = ("waterfront",    "mean"),
            lat                = ("lat",           "mean"),
            lon                = ("long",          "mean"),
        )
        .reset_index()
    )

    # Value gap: quality score vs actual price score
    area_stats["quality_score"] = (
        (area_stats["median_grade"] / area_stats["median_grade"].max()) * 0.6 +
        (area_stats["median_sqft"]  / area_stats["median_sqft"].max())  * 0.4
    )
    area_stats["price_score"] = (
        area_stats["median_price"] / area_stats["median_price"].max()
    )
    area_stats["value_gap"] = area_stats["quality_score"] - area_stats["price_score"]

    # Only areas with sufficient data
    top_undervalued = (
        area_stats[area_stats["count"] >= 15]
        .nlargest(8, "value_gap")
        .reset_index(drop=True)
    )

    undervalued_areas = [
        {
            "neighbourhood":  row["neighbourhood"],
            "median_price":   int(row["median_price"]),
            "median_grade":   round(float(row["median_grade"]), 1),
            "median_sqft":    int(row["median_sqft"]),
            "price_per_sqft": round(float(row["price_per_sqft"]), 0),
            "value_gap":      round(float(row["value_gap"]), 3),
            "count":          int(row["count"]),
            "waterfront_pct": round(float(row["waterfront_pct"]) * 100, 1),
            "lat":            round(float(row["lat"]), 4),
            "lon":            round(float(row["lon"]), 4),
            "rank":           i + 1,
        }
        for i, row in top_undervalued.iterrows()
    ]

    # ── 3. All neighbourhood data for heatmap ─────────────────────────
    all_areas = [
        {
            "neighbourhood":  row["neighbourhood"],
            "median_price":   int(row["median_price"]),
            "price_per_sqft": round(float(row["price_per_sqft"]), 0),
            "value_gap":      round(float(row["value_gap"]), 3),
            "quality_score":  round(float(row["quality_score"]), 3),
            "count":          int(row["count"]),
            "lat":            round(float(row["lat"]), 4),
            "lon":            round(float(row["lon"]), 4),
        }
        for _, row in area_stats[area_stats["count"] >= 10].iterrows()
    ]

    # ── 4. Linear Regression per Segment ─────────────────────────────
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
        r2 = round(float(r2_score(y, y_pred)), 3)
        coefs = [
            {
                "feature":     feat,
                "coefficient": round(float(coef), 0),
                "direction":   "positive" if coef > 0 else "negative",
            }
            for feat, coef in zip(REG_FEATURES, lr.coef_)
        ]
        coefs.sort(key=lambda x: abs(x["coefficient"]), reverse=True)
        segment_regression.append({
            "segment":           seg_name,
            "n":                 int(len(seg)),
            "r2":                r2,
            "intercept":         round(float(lr.intercept_), 0),
            "coefficients":      coefs,
            "top_driver":        coefs[0]["feature"],
            "top_driver_value":  coefs[0]["coefficient"],
        })

    # ── 5. Seasonal Price Forecast ────────────────────────────────────
    monthly = (
        df.groupby(df["date"].dt.to_period("M"))["price"]
        .median()
        .reset_index()
    )
    monthly.columns = ["period", "median_price"]
    monthly = monthly.sort_values("period")

    n = len(monthly)
    x = np.arange(n)
    slope, intercept = np.polyfit(x, monthly["median_price"], 1)

    forecast_months = []
    last_period = monthly["period"].iloc[-1]
    for i in range(1, 4):
        next_period = last_period + i
        forecast_months.append({
            "month":          str(next_period),
            "forecast_price": int(intercept + slope * (n + i - 1)),
            "is_forecast":    True,
        })

    price_forecast = [
        {
            "month":        str(row["period"]),
            "median_price": int(row["median_price"]),
            "is_forecast":  False,
        }
        for _, row in monthly.iterrows()
    ] + forecast_months

    # ── 6. Renovation ROI ─────────────────────────────────────────────
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

    # ── 7. Price ranges per segment ───────────────────────────────────
    price_ranges = {
        seg["segment"]: {
            "p25": int(df[df["segment"] == seg["segment"]]["price"].quantile(0.25)),
            "p50": int(df[df["segment"] == seg["segment"]]["price"].quantile(0.50)),
            "p75": int(df[df["segment"] == seg["segment"]]["price"].quantile(0.75)),
        }
        for seg in segment_regression
    }

    # ── Groq context ──────────────────────────────────────────────────
    top_area   = undervalued_areas[0] if undervalued_areas else {}
    forecast_3m = forecast_months[-1]["forecast_price"] if forecast_months else None
    current_median = int(monthly["median_price"].iloc[-1])

    groq_context = {
        "reno_premium":          reno_premium,
        "top_area":              top_area.get("neighbourhood"),
        "top_area_price_psf":    top_area.get("price_per_sqft"),
        "top_area_grade":        top_area.get("median_grade"),
        "forecast_3m_price":     forecast_3m,
        "current_median":        current_median,
        "forecast_change_pct":   round((forecast_3m - current_median) / current_median * 100, 1)
                                 if forecast_3m else None,
        "entry_top_driver":      next(
            (s["top_driver"] for s in segment_regression if s["segment"] == "Entry-Level"), None
        ),
        "luxury_top_driver":     next(
            (s["top_driver"] for s in segment_regression if s["segment"] == "Luxury"), None
        ),
    }

    return {
        "segment_regression": segment_regression,
        "price_forecast":     price_forecast,
        "undervalued_areas":  undervalued_areas,
        "all_areas":          all_areas,
        "reno_chart":         reno_chart,
        "reno_premium":       reno_premium,
        "price_ranges":       price_ranges,
        "groq_context":       groq_context,
    }
