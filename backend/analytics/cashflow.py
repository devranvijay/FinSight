"""
Cash Flow Analytics – Monthly and daily cash flow computation.
"""
import pandas as pd
import numpy as np
from database import DB


def _load_transactions() -> pd.DataFrame:
    rows = DB.fetch_all("SELECT * FROM transactions ORDER BY date ASC")
    if not rows:
        return pd.DataFrame()
    df = pd.DataFrame(rows)
    df["date"]   = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"])
    return df


def get_monthly_cashflow() -> list:
    """
    Returns monthly cash flow: income, expenses, net, cumulative_net.
    KPI Purpose: Reveals seasonal patterns, identifies cash-tight months.
    """
    df = _load_transactions()
    if df.empty:
        return []

    df["month"] = df["date"].dt.to_period("M")

    income   = df[df["type"] == "income"  ].groupby("month")["amount"].sum().abs()
    expenses = df[df["type"] == "expense" ].groupby("month")["amount"].sum().abs()
    
    all_months = df["month"].sort_values().unique()
    result = []
    cumulative = 0.0
    for m in all_months:
        inc = float(income.get(m, 0))
        exp = float(expenses.get(m, 0))
        net = inc - exp
        cumulative += net
        result.append({
            "month":          str(m),
            "income":         round(inc, 2),
            "expenses":       round(exp, 2),
            "net":            round(net, 2),
            "cumulative_net": round(cumulative, 2),
        })
    return result


def get_daily_cashflow(days: int = 90) -> list:
    """Returns daily net cash flow for the last N days."""
    df = _load_transactions()
    if df.empty:
        return []
    
    cutoff   = pd.Timestamp.now() - pd.Timedelta(days=days)
    df       = df[df["date"] >= cutoff]
    df["day"] = df["date"].dt.date

    income   = df[df["type"] == "income"  ].groupby("day")["amount"].sum().abs()
    expenses = df[df["type"] == "expense" ].groupby("day")["amount"].sum().abs()

    all_days = pd.date_range(df["date"].min(), df["date"].max(), freq="D").date
    result = []
    for day in all_days:
        inc = float(income.get(day, 0))
        exp = float(expenses.get(day, 0))
        result.append({
            "date":     str(day),
            "income":   round(inc, 2),
            "expenses": round(exp, 2),
            "net":      round(inc - exp, 2),
        })
    return result


def get_category_breakdown() -> list:
    """
    Category-wise expense aggregation with % share.
    KPI Purpose: Identifies top cost drivers for cost optimization decisions.
    """
    df = _load_transactions()
    if df.empty:
        return []
    
    expenses = df[df["type"] == "expense"].copy()
    expenses["amount"] = expenses["amount"].abs()
    total = expenses["amount"].sum()
    
    grouped = (
        expenses.groupby("category")["amount"]
        .sum()
        .sort_values(ascending=False)
        .reset_index()
    )
    result = []
    for _, row in grouped.iterrows():
        result.append({
            "category": row["category"],
            "amount":   round(float(row["amount"]), 2),
            "percent":  round(float(row["amount"]) / total * 100, 1) if total > 0 else 0,
        })
    return result


def get_income_expense_trends() -> list:
    """
    Month-over-month income vs expense trend with growth rates.
    KPI Purpose: Tracks financial direction — are we growing or burning?
    """
    monthly = get_monthly_cashflow()
    result  = []
    for i, m in enumerate(monthly):
        prev = monthly[i - 1] if i > 0 else None
        income_growth  = None
        expense_growth = None
        if prev:
            if prev["income"] > 0:
                income_growth  = round((m["income"]   - prev["income"])   / prev["income"]   * 100, 1)
            if prev["expenses"] > 0:
                expense_growth = round((m["expenses"] - prev["expenses"]) / prev["expenses"] * 100, 1)
        result.append({
            **m,
            "income_growth_pct":  income_growth,
            "expense_growth_pct": expense_growth,
        })
    return result
