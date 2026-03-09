"""
data_loader.py
Loads and cleans the King County housing CSV once at server startup.
All pipelines receive the same cleaned DataFrame from here.
"""

import pandas as pd
import numpy as np
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "house_data.csv"


def load_data() -> pd.DataFrame:
    """
    Load, clean and feature-engineer the King County dataset.
    Returns a single DataFrame used by all pipelines.
    """
    df = pd.read_csv(DATA_PATH)

    # ── 1. Parse dates ──────────────────────────────────────────────
    df["date"] = pd.to_datetime(df["date"], format="mixed")
    df["year"]  = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["month_label"] = df["date"].dt.strftime("%b %Y")

    # ── 2. Drop duplicate IDs (keep most recent sale) ───────────────
    df = df.sort_values("date").drop_duplicates(subset="id", keep="last")

    # ── 3. Remove implausible outliers ──────────────────────────────
    # 33-bedroom entry is a known data error
    df = df[df["bedrooms"] < 20]
    # Prices below $50K are likely errors
    df = df[df["price"] >= 50_000]

    # ── 4. Feature engineering ──────────────────────────────────────
    # Price per square foot — useful for segment comparisons
    df["price_per_sqft"] = (df["price"] / df["sqft_living"]).round(2)

    # Was the property ever renovated?
    df["renovated"] = (df["yr_renovated"] > 0).astype(int)

    # Property age at time of sale
    df["age"] = df["year"] - df["yr_built"]

    # Years since renovation (0 if never renovated)
    df["yrs_since_reno"] = np.where(
        df["yr_renovated"] > 0,
        df["year"] - df["yr_renovated"],
        0
    )

    # Basement present?
    df["has_basement"] = (df["sqft_basement"] > 0).astype(int)

    # Log price — used internally by regression to handle skew
    df["log_price"] = np.log(df["price"])

    # ── 5. Encode ordinal/binary labels for display ─────────────────
    condition_map = {1: "Poor", 2: "Fair", 3: "Average", 4: "Good", 5: "Excellent"}
    df["condition_label"] = df["condition"].map(condition_map)

    view_map = {0: "None", 1: "Fair", 2: "Average", 3: "Good", 4: "Excellent"}
    df["view_label"] = df["view"].map(view_map)

    df["waterfront_label"] = df["waterfront"].map({0: "No", 1: "Yes"})

    return df
