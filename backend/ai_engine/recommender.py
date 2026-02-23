"""
Smart Recommendation Engine – Generates prioritized, actionable recommendations
based on financial health score, risk score, and category analysis.
"""
from analytics.health_score import compute_health_score
from analytics.cashflow import get_category_breakdown, get_monthly_cashflow
from ai_engine.risk_scorer import compute_risk_score


def generate_recommendations() -> list:
    """
    Returns a prioritized list of financial recommendations.
    Each recommendation has: priority, category, title, detail, action.
    """
    health  = compute_health_score()
    risk    = compute_risk_score()
    cats    = get_category_breakdown()
    monthly = get_monthly_cashflow()

    recommendations = []
    priority_counter = 1

    # Guard: if DB is empty, health metrics won't be present
    if not health.get("metrics"):
        return recommendations

    # ── Runway & Burn Rate ────────────────────────────────────────────────────
    runway = health["metrics"]["runway_months"]
    burn   = health["metrics"]["monthly_burn_rate"]
    if runway < 3:
        recommendations.append({
            "priority": priority_counter, "priority_counter": priority_counter,
            "category": "Liquidity", "urgency": "critical",
            "title":  "🚨 Critical: Runway Below 3 Months",
            "detail": f"Current runway is {runway:.1f} months at ${burn:,.0f}/month burn rate. "
                      "Immediate revenue acceleration or cost cutting is required.",
            "action": "Review all non-essential expenses. Initiate emergency fundraising or line of credit application."
        })
        priority_counter += 1
    elif runway < 6:
        recommendations.append({
            "priority": priority_counter,
            "category": "Liquidity", "urgency": "high",
            "title":  "⚠️ Runway Below 6 Months",
            "detail": f"Runway is {runway:.1f} months. Target is 6+ months for operational stability.",
            "action": "Accelerate collections. Review subscription costs and defer non-critical spend."
        })
        priority_counter += 1

    # ── Top Expense Category ──────────────────────────────────────────────────
    if cats:
        top_cat = cats[0]
        if top_cat["percent"] > 40:
            recommendations.append({
                "priority": priority_counter,
                "category": "Cost Optimization", "urgency": "medium",
                "title":  f"📊 '{top_cat['category'].title()}' Dominates Spend at {top_cat['percent']:.0f}%",
                "detail": f"${top_cat['amount']:,.0f} spent in {top_cat['category']} — {top_cat['percent']:.0f}% of total expenses.",
                "action": f"Audit {top_cat['category']} spend. Negotiate vendor contracts or find alternatives."
            })
            priority_counter += 1

    # ── Expense Growth Alert ──────────────────────────────────────────────────
    if len(monthly) >= 2:
        last  = monthly[-1]
        prev  = monthly[-2]
        if prev["expenses"] > 0:
            exp_growth = (last["expenses"] - prev["expenses"]) / prev["expenses"] * 100
            if exp_growth > 15:
                recommendations.append({
                    "priority": priority_counter,
                    "category": "Expense Control", "urgency": "high",
                    "title":  f"📈 Expenses Grew {exp_growth:.0f}% Last Month",
                    "detail": f"Monthly expenses rose from ${prev['expenses']:,.0f} to ${last['expenses']:,.0f}.",
                    "action": "Identify the category driving growth. Implement a spend approval process for amounts > $500."
                })
                priority_counter += 1

    # ── Income Diversification ────────────────────────────────────────────────
    inc_consistency = health["components"]["income_consistency"]
    if inc_consistency < 60:
        recommendations.append({
            "priority": priority_counter,
            "category": "Revenue Strategy", "urgency": "medium",
            "title":  "📉 High Income Variability Detected",
            "detail": f"Income consistency score is {inc_consistency:.0f}/100 — revenue is unpredictable.",
            "action": "Introduce recurring revenue streams (subscriptions, retainers). Diversify customer base."
        })
        priority_counter += 1

    # ── Health Score Improvement ──────────────────────────────────────────────
    score = health["score"]
    if score < 50:
        recommendations.append({
            "priority": priority_counter,
            "category": "Financial Health", "urgency": "high",
            "title":  f"🏥 Financial Health Score is {score}/100",
            "detail": "Overall financial health is below the healthy threshold of 60.",
            "action": "Address top risk factors: improve runway, stabilize income, control expense growth."
        })
        priority_counter += 1

    # ── Positive Reinforcement ────────────────────────────────────────────────
    if score >= 80 and runway >= 12:
        recommendations.append({
            "priority": priority_counter,
            "category": "Growth", "urgency": "low",
            "title":  "✅ Strong Financial Position — Consider Growth Investment",
            "detail": f"Health score {score}/100 with {runway:.1f} months runway. "
                      "Capital can be deployed for strategic growth.",
            "action": "Evaluate ROI-positive investments: marketing, hiring, product expansion."
        })

    return recommendations
