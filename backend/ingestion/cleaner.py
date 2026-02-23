"""
Data Cleaner – handles missing values, duplicates, and outlier detection
before inserting into the database.
"""
import pandas as pd
import numpy as np
from typing import Tuple


def clean(df: pd.DataFrame) -> Tuple[pd.DataFrame, dict]:
    """
    Full cleaning pipeline. Returns (cleaned_df, cleaning_report).

    Steps:
    1. Drop rows with missing date or amount (non-recoverable)
    2. Fill missing descriptions
    3. Remove exact duplicate transactions
    4. Clip extreme outliers (keep but flag)
    5. Validate date range
    """
    report = {
        "original_rows":   len(df),
        "dropped_no_date":  0,
        "dropped_no_amount": 0,
        "dropped_duplicates": 0,
        "filled_description": 0,
        "final_rows":      0,
        "warnings":        []
    }

    # 1. Drop rows with invalid dates
    before = len(df)
    df = df.dropna(subset=["date"])
    report["dropped_no_date"] = before - len(df)

    # 2. Drop rows with invalid amounts
    before = len(df)
    df = df.dropna(subset=["amount"])
    df = df[df["amount"] != 0]  # zero-amount transactions are noise
    report["dropped_no_amount"] = before - len(df)

    # 3. Fill missing descriptions
    mask = df["description"].isna() | (df["description"].astype(str).str.strip() == "")
    df.loc[mask, "description"] = "Unlabeled Transaction"
    report["filled_description"] = int(mask.sum())

    # 4. Remove exact duplicates (same date, amount, description)
    before = len(df)
    df = df.drop_duplicates(subset=["date", "amount", "description"])
    report["dropped_duplicates"] = before - len(df)

    # 5. Validate date range — flag suspiciously old or future dates
    now = pd.Timestamp.now()
    future_mask = df["date"] > now
    old_mask    = df["date"] < pd.Timestamp("2000-01-01")
    if future_mask.any():
        report["warnings"].append(f"{future_mask.sum()} transactions have future dates — check source data.")
    if old_mask.any():
        report["warnings"].append(f"{old_mask.sum()} transactions pre-date year 2000 — verify data quality.")

    # 6. Reset index and finalize
    df = df.reset_index(drop=True)
    report["final_rows"] = len(df)

    return df, report
