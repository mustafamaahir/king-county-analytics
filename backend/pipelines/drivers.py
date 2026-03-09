"""
pipelines/drivers.py
Tab 5 — Drivers
Random Forest Regressor to identify what variables most influence price.
Answers: What actually causes a King County house to be worth more?
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler


FEATURES = [
    "sqft_living", "grade", "lat", "waterfront", "view",
    "sqft_above", "bathrooms", "sqft_living15", "floors",
    "condition", "age", "renovated", "has_basement", "sqft_basement",
]

FEATURE_LABELS = {
    "sqft_living":    "Living Area (sqft)",
    "grade":          "Build Quality Grade",
    "lat":            "Location (Latitude)",
    "waterfront":     "Waterfront Property",
    "view":           "View Quality",
    "sqft_above":     "Above-Ground sqft",
    "bathrooms":      "Bathrooms",
    "sqft_living15":  "Neighbourhood Avg. Size",
    "floors":         "Number of Floors",
    "condition":      "Property Condition",
    "age":            "Property Age",
    "renovated":      "Was Renovated",
    "has_basement":   "Has Basement",
    "sqft_basement":  "Basement Size (sqft)",
}


def run(df: pd.DataFrame) -> dict:

    X = df[FEATURES].copy()
    y = df["price"].copy()

    # ── Train / test split ───────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # ── Train Random Forest ──────────────────────────────────────────
    rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)

    # ── Evaluation metrics ───────────────────────────────────────────
    y_pred    = rf.predict(X_test)
    r2        = round(float(r2_score(y_test, y_pred)), 3)
    mae       = round(float(mean_absolute_error(y_test, y_pred)), 0)
    mape      = round(float(np.mean(np.abs((y_test - y_pred) / y_test)) * 100), 1)

    # ── Feature importance ───────────────────────────────────────────
    importance_df = pd.DataFrame({
        "feature":    FEATURES,
        "label":      [FEATURE_LABELS[f] for f in FEATURES],
        "importance": rf.feature_importances_,
    }).sort_values("importance", ascending=False)

    feature_importance_chart = [
        {
            "feature":    row["feature"],
            "label":      row["label"],
            "importance": round(float(row["importance"]), 4),
            "importance_pct": round(float(row["importance"]) * 100, 1),
        }
        for _, row in importance_df.iterrows()
    ]

    top3_combined_pct = round(
        float(importance_df["importance"].head(3).sum()) * 100, 1
    )

    # ── Grade vs Price box plot data ─────────────────────────────────
    grade_price = (
        df.groupby("grade")["price"]
        .agg(
            median="median",
            q1=lambda x: x.quantile(0.25),
            q3=lambda x: x.quantile(0.75),
            min=lambda x: x.quantile(0.05),
            max=lambda x: x.quantile(0.95),
            count="count",
        )
        .reset_index()
    )
    grade_box_chart = [
        {
            "grade":  int(row["grade"]),
            "median": int(row["median"]),
            "q1":     int(row["q1"]),
            "q3":     int(row["q3"]),
            "min":    int(row["min"]),
            "max":    int(row["max"]),
            "count":  int(row["count"]),
        }
        for _, row in grade_price.iterrows()
    ]

    # ── sqft_living vs price (partial dependence proxy) ──────────────
    sqft_bins = pd.cut(df["sqft_living"], bins=20)
    sqft_price = (
        df.groupby(sqft_bins, observed=True)["price"]
        .median()
        .reset_index()
    )
    sqft_price["sqft_mid"] = sqft_price["sqft_living"].apply(
        lambda x: int(x.mid) if hasattr(x, "mid") else 0
    )
    sqft_chart = [
        {"sqft": int(row["sqft_mid"]), "median_price": int(row["price"])}
        for _, row in sqft_price.iterrows()
        if row["sqft_mid"] > 0
    ]

    # ── Predicted vs Actual sample ────────────────────────────────────
    sample_idx = np.random.choice(len(X_test), size=min(300, len(X_test)), replace=False)
    pred_vs_actual = [
        {
            "actual":    int(y_test.iloc[i]),
            "predicted": int(y_pred[i]),
        }
        for i in sample_idx
    ]

    # ── Groq context ──────────────────────────────────────────────────
    top_feature   = feature_importance_chart[0]
    second_feature = feature_importance_chart[1]

    groq_context = {
        "r2_score":            r2,
        "mae":                 int(mae),
        "mape":                mape,
        "top_feature":         top_feature["label"],
        "top_feature_pct":     top_feature["importance_pct"],
        "second_feature":      second_feature["label"],
        "second_feature_pct":  second_feature["importance_pct"],
        "top3_combined_pct":   top3_combined_pct,
        "waterfront_importance": next(
            f["importance_pct"] for f in feature_importance_chart
            if f["feature"] == "waterfront"
        ),
        "grade_7_to_8_delta":  int(
            df[df["grade"] == 8]["price"].median() -
            df[df["grade"] == 7]["price"].median()
        ),
    }

    return {
        "feature_importance_chart": feature_importance_chart,
        "grade_box_chart":          grade_box_chart,
        "sqft_chart":               sqft_chart,
        "pred_vs_actual":           pred_vs_actual,
        "model_metrics":            {"r2": r2, "mae": int(mae), "mape": mape},
        "groq_context":             groq_context,
    }
