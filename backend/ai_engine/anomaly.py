"""
Anomaly Detection Engine – Dual method: Z-score + IQR per category.
Flags statistically unusual transactions with explanation.
"""
import numpy as np
import pandas as pd
from database import DB


def detect_anomalies(zscore_threshold: float = 2.5, iqr_multiplier: float = 1.5) -> list:
    """
    Flag anomalous transactions within each category using two methods:
    1. Z-score: |z| > threshold flags the transaction
    2. IQR: value outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]

    Returns list of anomaly records with explanation and severity.
    """
    rows = DB.fetch_all("SELECT * FROM transactions WHERE type != 'transfer' ORDER BY date ASC")
    if not rows:
        return []

    df = pd.DataFrame(rows)
    df["date"]   = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"]).abs()  # work with absolute amounts

    anomalies = []

    for cat, group in df.groupby("category"):
        if len(group) < 4:
            # Insufficient data for statistical detection in this category
            continue

        amounts = group["amount"].values
        mean    = np.mean(amounts)
        std     = np.std(amounts) if np.std(amounts) > 0 else 1
        q1      = np.percentile(amounts, 25)
        q3      = np.percentile(amounts, 75)
        iqr     = q3 - q1
        lb      = q1 - iqr_multiplier * iqr
        ub      = q3 + iqr_multiplier * iqr

        for _, row in group.iterrows():
            amt      = float(row["amount"])
            z        = abs((amt - mean) / std)
            in_iqr   = (amt < lb) or (amt > ub)

            if z > zscore_threshold or in_iqr:
                method    = []
                if z > zscore_threshold: method.append(f"Z-score={z:.1f}")
                if in_iqr:               method.append("IQR outlier")

                severity = (
                    "critical" if z > 4.0 else
                    "high"     if z > 3.0 else
                    "medium"
                )

                anomalies.append({
                    "id":          row["id"],
                    "date":        str(row["date"].date()),
                    "description": row["description"],
                    "category":    cat,
                    "amount":      round(amt, 2),
                    "type":        row["type"],
                    "z_score":     round(z, 2),
                    "category_mean": round(mean, 2),
                    "severity":    severity,
                    "detection_method": ", ".join(method),
                    "explanation": (
                        f"Transaction of ${amt:,.2f} in '{cat}' is {z:.1f}× std deviations "
                        f"from the category mean (${mean:,.2f}). "
                        f"Detected by: {', '.join(method)}."
                    )
                })

    # Sort by severity then z-score
    severity_order = {"critical": 0, "high": 1, "medium": 2}
    anomalies.sort(key=lambda x: (severity_order.get(x["severity"], 3), -x["z_score"]))
    return anomalies
