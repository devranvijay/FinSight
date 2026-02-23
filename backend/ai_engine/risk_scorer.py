"""
Risk Scoring Engine – Rule-based + statistical risk assessment.
Produces a 0–100 risk score with Low/Medium/High level and factor breakdown.
"""
import numpy as np
import pandas as pd
from database import DB
from analytics.health_score import compute_health_score


def compute_risk_score() -> dict:
    """
    Risk factors and weights:
      40 pts – Runway < 3 months
      25 pts – Expense growth > 15% MoM (last 2 months)
      25 pts – Income decline > 10% MoM (last 2 months)
      10 pts – High anomaly count (> 3 in last 30 days)
    
    Low:    0–30  | Medium: 31–65 | High: 66–100
    """
    rows = DB.fetch_all("SELECT * FROM transactions ORDER BY date ASC")
    if not rows:
        return {"score": 0, "level": "Unknown", "factors": [], "recommendation": "No data available."}

    df = pd.DataFrame(rows)
    df["date"]   = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"])
    df["month"]  = df["date"].dt.to_period("M")

    health = compute_health_score()
    runway = health["metrics"]["runway_months"]

    income_m   = df[df["type"] == "income" ].groupby("month")["amount"].sum().abs()
    expense_m  = df[df["type"] == "expense"].groupby("month")["amount"].sum().abs()

    factors    = []
    risk_score = 0

    # ── Factor 1: Runway Risk ─────────────────────────────────────────────────
    if runway < 1:
        pts = 40
        factors.append({"factor": "Critical Runway", "points": pts,
                         "detail": f"Only {runway:.1f} months of runway remaining."})
    elif runway < 3:
        pts = 28
        factors.append({"factor": "Low Runway", "points": pts,
                         "detail": f"{runway:.1f} months runway — critical threshold is 3 months."})
    elif runway < 6:
        pts = 15
        factors.append({"factor": "Moderate Runway", "points": pts,
                         "detail": f"{runway:.1f} months runway — healthy target is 6+ months."})
    else:
        factors.append({"factor": "Healthy Runway", "points": 0,
                         "detail": f"{runway:.1f} months runway — above safe threshold."})
    risk_score += factors[-1]["points"]

    # ── Factor 2: Expense Growth ──────────────────────────────────────────────
    if len(expense_m) >= 2:
        exp_growth = float((expense_m.iloc[-1] - expense_m.iloc[-2]) / expense_m.iloc[-2] * 100) if expense_m.iloc[-2] > 0 else 0
        if exp_growth > 30:
            pts = 25
            factors.append({"factor": "Rapid Expense Growth", "points": pts,
                             "detail": f"Expenses grew {exp_growth:.1f}% month-over-month."})
        elif exp_growth > 15:
            pts = 15
            factors.append({"factor": "Elevated Expense Growth", "points": pts,
                             "detail": f"Expenses grew {exp_growth:.1f}% MoM (threshold: 15%)."})
        else:
            factors.append({"factor": "Stable Expenses", "points": 0,
                             "detail": f"Expense growth at {exp_growth:.1f}% MoM — within normal range."})
        risk_score += factors[-1]["points"]

    # ── Factor 3: Income Decline ──────────────────────────────────────────────
    if len(income_m) >= 2:
        inc_change = float((income_m.iloc[-1] - income_m.iloc[-2]) / income_m.iloc[-2] * 100) if income_m.iloc[-2] > 0 else 0
        if inc_change < -20:
            pts = 25
            factors.append({"factor": "Severe Income Decline", "points": pts,
                             "detail": f"Income fell {abs(inc_change):.1f}% MoM."})
        elif inc_change < -10:
            pts = 15
            factors.append({"factor": "Income Decline", "points": pts,
                             "detail": f"Income fell {abs(inc_change):.1f}% MoM (threshold: 10%)."})
        else:
            factors.append({"factor": "Stable Income", "points": 0,
                             "detail": f"Income change is {inc_change:+.1f}% MoM — normal."})
        risk_score += factors[-1]["points"]

    # ── Factor 4: Recent Anomaly Count ────────────────────────────────────────
    cutoff = pd.Timestamp.now() - pd.Timedelta(days=30)
    recent = df[df["date"] >= cutoff]
    # Simple proxy: transactions > 3x category mean in recent period
    from ai_engine.anomaly import detect_anomalies
    anomalies = detect_anomalies()
    recent_anomalies = [a for a in anomalies if pd.Timestamp(a["date"]) >= cutoff]
    n_anomalies = len(recent_anomalies)
    if n_anomalies > 5:
        pts = 10
        factors.append({"factor": "High Anomaly Activity", "points": pts,
                         "detail": f"{n_anomalies} anomalous transactions in last 30 days."})
    elif n_anomalies > 2:
        pts = 5
        factors.append({"factor": "Moderate Anomaly Activity", "points": pts,
                         "detail": f"{n_anomalies} anomalous transactions in last 30 days."})
    else:
        factors.append({"factor": "Low Anomaly Activity", "points": 0,
                         "detail": f"{n_anomalies} anomalous transactions — within normal range."})
    risk_score += factors[-1]["points"]

    risk_score = min(100, risk_score)
    level = "Low" if risk_score <= 30 else "Medium" if risk_score <= 65 else "High"

    recommendation = _generate_recommendation(level, factors, runway)

    return {
        "score":          risk_score,
        "level":          level,
        "factors":        factors,
        "health_score":   health["score"],
        "runway_months":  round(runway, 1),
        "recommendation": recommendation,
    }


def _generate_recommendation(level: str, factors: list, runway: float) -> str:
    if level == "High":
        return (
            f"URGENT: High financial risk detected. Immediate action required. "
            f"With only {runway:.1f} months of runway and elevated expense growth, "
            "prioritize revenue acceleration and emergency cost reduction. "
            "Consider speaking to a financial advisor immediately."
        )
    elif level == "Medium":
        return (
            "Moderate risk level. Monitor expense growth closely. "
            "Review top cost categories for optimization opportunities. "
            f"Runway of {runway:.1f} months provides some buffer — target 6+ months."
        )
    else:
        return (
            f"Financial position is stable. Runway of {runway:.1f} months is healthy. "
            "Continue monitoring for expense drift and maintain income diversification."
        )
