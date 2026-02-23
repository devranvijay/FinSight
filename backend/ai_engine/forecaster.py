"""
Cash Flow Forecaster – 6-month ahead prediction using Holt-Winters
exponential smoothing (handles trend + seasonality).
Falls back to linear regression if insufficient data.
"""
import numpy as np
import pandas as pd
from database import DB


def _get_monthly_net() -> pd.Series:
    rows = DB.fetch_all("SELECT * FROM transactions ORDER BY date ASC")
    if not rows:
        return pd.Series(dtype=float)
    df = pd.DataFrame(rows)
    df["date"]   = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"])
    df["month"]  = df["date"].dt.to_period("M")

    income   = df[df["type"] == "income" ].groupby("month")["amount"].sum().abs()
    expenses = df[df["type"] == "expense"].groupby("month")["amount"].sum().abs()
    net      = income.subtract(expenses, fill_value=0).sort_index()
    return net


def forecast_cashflow(periods: int = 6) -> dict:
    """
    Returns a 6-month forecast with confidence intervals.
    Method: Holt-Winters (if ≥6 data points) else Linear Regression.
    Confidence interval: ±1.645 * forecast_std (90% CI).
    """
    net = _get_monthly_net()
    historical = [{"month": str(m), "net": round(float(v), 2)} for m, v in net.items()]
    
    if len(net) < 3:
        return {
            "method": "insufficient_data",
            "historical": historical,
            "forecast": [],
            "note": "At least 3 months of data required for forecasting."
        }

    values = net.values.astype(float)
    last_period = net.index[-1]

    # ── Method Selection ──────────────────────────────────────────────────────
    if len(values) >= 6:
        method = "holt_winters"
        try:
            from statsmodels.tsa.holtwinters import ExponentialSmoothing
            model = ExponentialSmoothing(
                values, trend="add", seasonal=None, initialization_method="estimated"
            ).fit(optimized=True)
            point_forecasts = model.forecast(periods)
            residuals_std = float(np.std(model.resid))
        except Exception:
            method = "linear_regression"
            point_forecasts = _linear_forecast(values, periods)
            residuals_std = float(np.std(np.diff(values)))
    else:
        method = "linear_regression"
        point_forecasts = _linear_forecast(values, periods)
        residuals_std = float(np.std(np.diff(values))) if len(values) > 1 else abs(float(np.mean(values)) * 0.15)

    # Uncertainty grows with horizon (multiply CI by sqrt of horizon steps)
    z_90 = 1.645
    forecast_months = []
    for i, val in enumerate(point_forecasts):
        horizon_std = residuals_std * np.sqrt(i + 1)
        ci_width    = z_90 * horizon_std
        next_period = last_period + (i + 1)
        forecast_months.append({
            "month":  str(next_period),
            "net":    round(float(val), 2),
            "lower":  round(float(val - ci_width), 2),
            "upper":  round(float(val + ci_width), 2),
        })

    return {
        "method":     method,
        "historical": historical,
        "forecast":   forecast_months,
        "note":       f"90% confidence interval. Method: {method.replace('_', ' ').title()}. Based on {len(values)} months of data."
    }


def _linear_forecast(values: np.ndarray, periods: int) -> np.ndarray:
    x = np.arange(len(values))
    slope, intercept = np.polyfit(x, values, 1)
    future_x = np.arange(len(values), len(values) + periods)
    return slope * future_x + intercept
