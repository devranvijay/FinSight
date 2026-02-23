"""
AI Financial Assistant – Analytics-grounded conversational engine.

Design:
  - NO external LLM API calls (no hallucination risk)
  - Intent classification via keyword matching tree
  - Responses populated with real computed analytics values
  - Structured response templates for clarity and consistency
"""
import re
from analytics.health_score import compute_health_score
from analytics.cashflow import get_monthly_cashflow, get_category_breakdown
from ai_engine.risk_scorer import compute_risk_score
from ai_engine.forecaster import forecast_cashflow
from ai_engine.anomaly import detect_anomalies
from ai_engine.recommender import generate_recommendations


INTENTS = {
    "risk": [
        r"risk", r"financial risk", r"how risky", r"am i at risk",
        r"risk score", r"risk level", r"danger"
    ],
    "runway": [
        r"runway", r"how long", r"sustain", r"survive", r"last.*(month|year)",
        r"months? (of|left|remaining)", r"operations.*month"
    ],
    "expenses": [
        r"expense", r"spending", r"cost", r"why.*increase", r"where.*money",
        r"spend.*most", r"top.*cost", r"expense.*analysis"
    ],
    "forecast": [
        r"forecast", r"predict", r"next.*month", r"future.*cash",
        r"projection", r"expected.*income", r"coming.*month"
    ],
    "health": [
        r"health", r"score", r"financial health", r"how.*doing", r"performance",
        r"overall.*status", r"financial status"
    ],
    "anomaly": [
        r"anomal", r"unusual", r"suspicious", r"strange.*transaction",
        r"flagged", r"outlier", r"odd.*spend"
    ],
    "recommendation": [
        r"recommend", r"suggest", r"advise", r"what.*should", r"advice",
        r"improve", r"action", r"what.*do"
    ],
    "income": [
        r"income", r"revenue", r"earning", r"profit", r"how much.*earn",
        r"incom.*trend"
    ],
}


def _classify_intent(query: str) -> str:
    """Return the best-matching intent for the user query."""
    q   = query.lower()
    best_intent = "unknown"
    best_count  = 0

    for intent, patterns in INTENTS.items():
        count = sum(1 for p in patterns if re.search(p, q))
        if count > best_count:
            best_count  = count
            best_intent = intent

    return best_intent


def _handle_risk(query: str) -> str:
    risk = compute_risk_score()
    factors_text = "\n".join(
        f"  • {f['factor']}: {f['detail']}" for f in risk["factors"] if f["points"] > 0
    ) or "  • No significant risk factors identified."
    return (
        f"**Financial Risk Assessment**\n\n"
        f"Risk Score: **{risk['score']}/100** ({risk['level']} Risk)\n"
        f"Health Score: {risk['health_score']}/100\n"
        f"Runway: {risk['runway_months']} months\n\n"
        f"**Contributing Factors:**\n{factors_text}\n\n"
        f"**Recommendation:** {risk['recommendation']}"
    )


def _handle_runway(query: str) -> str:
    health = compute_health_score()
    runway = health["metrics"]["runway_months"]
    burn   = health["metrics"]["monthly_burn_rate"]
    if runway >= 12:
        status = "✅ Strong — you can sustain operations comfortably for 12+ months."
    elif runway >= 6:
        status = f"🟡 Moderate — approximately {runway:.1f} months of runway. Target is 6+ months."
    elif runway >= 3:
        status = f"⚠️ Caution — {runway:.1f} months remaining. Plan for fundraising or cost cuts."
    else:
        status = f"🚨 Critical — only {runway:.1f} months runway. Immediate action required."
    return (
        f"**Runway Analysis**\n\n"
        f"Current Runway: **{runway:.1f} months**\n"
        f"Monthly Burn Rate: **${burn:,.0f}**\n\n"
        f"Status: {status}\n\n"
        f"*Runway = (Cumulative Net Cash) ÷ (Avg 3-Month Burn Rate)*"
    )


def _handle_expenses(query: str) -> str:
    cats    = get_category_breakdown()
    monthly = get_monthly_cashflow()
    cat_text = "\n".join(
        f"  {i+1}. {c['category'].title()}: ${c['amount']:,.0f} ({c['percent']:.1f}%)"
        for i, c in enumerate(cats[:5])
    ) if cats else "  No expense data available."
    
    mom_text = ""
    if len(monthly) >= 2:
        last = monthly[-1]; prev = monthly[-2]
        change = last["expenses"] - prev["expenses"]
        pct    = (change / prev["expenses"] * 100) if prev["expenses"] > 0 else 0
        mom_text = (
            f"\n\n**Month-over-Month:** Expenses "
            f"{'increased' if change > 0 else 'decreased'} by "
            f"${abs(change):,.0f} ({pct:+.1f}%) from {prev['month']} to {last['month']}."
        )
    return (
        f"**Expense Analysis**\n\n"
        f"**Top 5 Expense Categories:**\n{cat_text}{mom_text}"
    )


def _handle_forecast(query: str) -> str:
    fc = forecast_cashflow(periods=6)
    if not fc["forecast"]:
        return f"**Forecast:** {fc.get('note', 'Insufficient data for forecasting.')}"
    lines = "\n".join(
        f"  {f['month']}: Net ${f['net']:+,.0f} (range ${f['lower']:,.0f} to ${f['upper']:,.0f})"
        for f in fc["forecast"]
    )
    return (
        f"**6-Month Cash Flow Forecast**\n\n"
        f"Method: {fc['method'].replace('_', ' ').title()}\n\n"
        f"{lines}\n\n"
        f"*{fc['note']}*"
    )


def _handle_health(query: str) -> str:
    h = compute_health_score()
    comp = h["components"]
    return (
        f"**Financial Health Score: {h['score']}/100 ({h['level']})**\n\n"
        f"Component Breakdown:\n"
        f"  • Cash Flow Score:      {comp['cashflow_score']:.0f}/100\n"
        f"  • Runway Score:         {comp['runway_score']:.0f}/100\n"
        f"  • Expense Stability:    {comp['expense_stability']:.0f}/100\n"
        f"  • Income Consistency:   {comp['income_consistency']:.0f}/100\n"
        f"  • Expense Ratio Score:  {comp['expense_ratio_score']:.0f}/100\n\n"
        f"{h['explanation']}"
    )


def _handle_anomaly(query: str) -> str:
    anomalies = detect_anomalies()[:5]
    if not anomalies:
        return "**Anomaly Detection:** No unusual transactions detected in your data. ✅"
    lines = "\n".join(
        f"  • [{a['severity'].upper()}] {a['date']} — {a['description']}: ${a['amount']:,.2f} "
        f"(Z={a['z_score']:.1f}, category avg ${a['category_mean']:,.0f})"
        for a in anomalies
    )
    return f"**Anomaly Detection — Top {len(anomalies)} Flagged Transactions:**\n\n{lines}"


def _handle_recommendation(query: str) -> str:
    recs = generate_recommendations()[:3]
    if not recs:
        return "**Recommendations:** No specific actions required at this time. Keep monitoring."
    lines = "\n\n".join(
        f"**{r['priority']}. {r['title']}**\n{r['detail']}\n→ *{r['action']}*"
        for r in recs
    )
    return f"**Top Financial Recommendations:**\n\n{lines}"


def _handle_income(query: str) -> str:
    monthly = get_monthly_cashflow()
    if not monthly:
        return "**Income Analysis:** No income data available."
    recent = monthly[-3:]
    lines = "\n".join(
        f"  • {m['month']}: Income ${m['income']:,.0f} | Expenses ${m['expenses']:,.0f} | Net ${m['net']:+,.0f}"
        for m in recent
    )
    return f"**Recent Income vs. Expense (Last 3 Months):**\n\n{lines}"


HANDLERS = {
    "risk":           _handle_risk,
    "runway":         _handle_runway,
    "expenses":       _handle_expenses,
    "forecast":       _handle_forecast,
    "health":         _handle_health,
    "anomaly":        _handle_anomaly,
    "recommendation": _handle_recommendation,
    "income":         _handle_income,
}


def chat(query: str) -> dict:
    """
    Process a user query and return a grounded response.
    Returns: { intent, response, confidence }
    """
    intent = _classify_intent(query)
    
    if intent == "unknown":
        return {
            "intent":   "unknown",
            "response": (
                "I can help you with:\n"
                "• Financial risk assessment\n"
                "• Runway and sustainability questions\n"
                "• Expense analysis and categories\n"
                "• Cash flow forecasting\n"
                "• Financial health score\n"
                "• Anomaly detection\n"
                "• Smart recommendations\n\n"
                "Try asking: *'What is my current financial risk?'* or *'Can I sustain operations for 3 more months?'*"
            ),
            "confidence": 0.0,
        }

    handler = HANDLERS[intent]
    response = handler(query)

    return {
        "intent":     intent,
        "response":   response,
        "confidence": 0.9,
    }
