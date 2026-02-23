"""
Financial Health Score Engine – Composite 0–100 score with explainability.

Scoring components (weighted):
  30% – Cash Flow Score       (avg monthly net vs avg income)
  25% – Runway Score          (months of runway vs 12-month benchmark)
  20% – Expense Stability     (coefficient of variation in monthly expenses)
  15% – Income Consistency    (coefficient of variation in monthly income)
  10% – Expense Ratio Score   (total expenses / total income)
"""
import numpy as np
import pandas as pd
from database import DB


def _load_monthly_summary():
    rows = DB.fetch_all("SELECT * FROM transactions ORDER BY date ASC")
    if not rows:
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
    df = pd.DataFrame(rows)
    df["date"]   = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"])
    df["month"]  = df["date"].dt.to_period("M")

    income   = df[df["type"] == "income" ].groupby("month")["amount"].sum().abs()
    expenses = df[df["type"] == "expense"].groupby("month")["amount"].sum().abs()
    return df, income, expenses


def compute_health_score() -> dict:
    df, income_series, expense_series = _load_monthly_summary()
    if df.empty:
        return {"score": 0, "level": "Unknown", "components": {}, "explanation": "No transaction data available."}

    # ── Component 1: Cash Flow Score ─────────────────────────────────────────
    avg_income   = float(income_series.mean())   if len(income_series)   > 0 else 0
    avg_expenses = float(expense_series.mean())  if len(expense_series)  > 0 else 0
    avg_net      = avg_income - avg_expenses
    cf_score     = max(0.0, min(100.0, (avg_net / avg_income * 100) if avg_income > 0 else 0))

    # ── Component 2: Runway Score ─────────────────────────────────────────────
    # Burn rate = avg of last 3 months expenses
    last3_expenses  = float(expense_series.tail(3).mean()) if len(expense_series) >= 1 else avg_expenses
    # Estimated cash: cumulative net
    cumulative_net  = float((income_series.sum() - expense_series.sum()))
    runway_months   = (cumulative_net / last3_expenses) if last3_expenses > 0 else 24
    runway_months   = max(0, runway_months)
    runway_score    = min(100.0, (runway_months / 12.0) * 100)

    # ── Component 3: Expense Stability Score ─────────────────────────────────
    if len(expense_series) >= 2 and expense_series.mean() > 0:
        exp_cv       = expense_series.std() / expense_series.mean()
        exp_stability = max(0.0, 100.0 - exp_cv * 100)
    else:
        exp_stability = 70.0

    # ── Component 4: Income Consistency Score ────────────────────────────────
    if len(income_series) >= 2 and income_series.mean() > 0:
        inc_cv          = income_series.std() / income_series.mean()
        income_consistency = max(0.0, 100.0 - inc_cv * 100)
    else:
        income_consistency = 70.0

    # ── Component 5: Expense Ratio Score ────────────────────────────────────
    total_income   = float(income_series.sum())
    total_expenses = float(expense_series.sum())
    exp_ratio      = (total_expenses / total_income) if total_income > 0 else 1.0
    ratio_score    = max(0.0, min(100.0, (1 - exp_ratio) * 200))  # <50% expenses = 100 pts

    # ── Composite ─────────────────────────────────────────────────────────────
    composite = (
        cf_score         * 0.30 +
        runway_score     * 0.25 +
        exp_stability    * 0.20 +
        income_consistency * 0.15 +
        ratio_score      * 0.10
    )
    composite = round(max(0.0, min(100.0, composite)), 1)

    level = (
        "Excellent" if composite >= 80 else
        "Good"      if composite >= 60 else
        "Fair"      if composite >= 40 else
        "Poor"
    )

    return {
        "score": composite,
        "level": level,
        "components": {
            "cashflow_score":       round(cf_score, 1),
            "runway_score":         round(runway_score, 1),
            "expense_stability":    round(exp_stability, 1),
            "income_consistency":   round(income_consistency, 1),
            "expense_ratio_score":  round(ratio_score, 1),
        },
        "metrics": {
            "avg_monthly_income":   round(avg_income, 2),
            "avg_monthly_expenses": round(avg_expenses, 2),
            "avg_monthly_net":      round(avg_net, 2),
            "runway_months":        round(runway_months, 1),
            "monthly_burn_rate":    round(last3_expenses, 2),
            "expense_ratio_pct":    round(exp_ratio * 100, 1),
        },
        "explanation": (
            f"Financial health is {level.lower()} ({composite}/100). "
            f"Average monthly net is ${avg_net:,.0f} with {runway_months:.1f} months runway. "
            f"Expense ratio is {exp_ratio*100:.0f}% of income. "
            + ("Strong cash generation. " if cf_score > 70 else "Cash flow needs attention. ")
            + ("Stable expense pattern." if exp_stability > 70 else "High expense volatility detected.")
        )
    }
