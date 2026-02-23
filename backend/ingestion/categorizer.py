"""
Transaction Categorizer – Multi-level keyword-based classification engine.
Assigns category + sub_category + confidence score to each transaction.
"""
import re
import pandas as pd

# Category taxonomy: category → sub_category → keywords
CATEGORY_RULES = {
    "payroll": {
        "salary":    ["salary", "payroll", "wages", "compensation", "base pay", "stipend"],
        "bonus":     ["bonus", "incentive", "commission", "reward"],
        "freelance": ["freelance", "contract payment", "consulting fee", "invoice payment"],
    },
    "revenue": {
        "sales":     ["sale", "revenue", "client payment", "customer payment", "subscription"],
        "investment": ["dividend", "interest income", "capital gain", "yield", "return"],
        "grants":    ["grant", "funding", "seed", "series", "investment received"],
    },
    "operations": {
        "rent":      ["rent", "lease", "office space", "coworking", "property"],
        "utilities": ["electricity", "water", "gas", "utility", "internet", "broadband", "wifi"],
        "software":  ["aws", "azure", "gcp", "google cloud", "saas", "software", "license", "subscription", "jira", "github", "slack", "notion", "figma"],
        "office":    ["stationery", "printer", "office supplies", "furniture"],
    },
    "marketing": {
        "advertising": ["facebook ads", "google ads", "meta ads", "advertising", "campaign", "promotion"],
        "pr":          ["pr", "public relations", "press release", "media"],
        "events":      ["conference", "event", "sponsorship", "exhibition", "trade show"],
    },
    "hr": {
        "recruitment": ["recruitment", "hiring", "headhunter", "job board", "linkedin recruiter"],
        "training":    ["training", "workshop", "course", "certification", "learning"],
        "benefits":    ["health insurance", "medical", "dental", "pension", "provident fund", "esi", "pf"],
    },
    "finance": {
        "banking":     ["bank charge", "bank fee", "wire transfer fee", "swift", "processing fee"],
        "taxes":       ["tax", "gst", "vat", "tds", "income tax", "advance tax"],
        "loan":        ["loan", "emi", "installment", "repayment", "mortgage"],
        "insurance":   ["insurance premium", "general insurance", "term insurance"],
    },
    "travel": {
        "transport":   ["uber", "ola", "cab", "taxi", "metro", "train", "bus", "fuel", "petrol"],
        "flights":     ["flight", "airline", "airfare", "indigo", "spicejet", "air india"],
        "lodging":     ["hotel", "airbnb", "accommodation", "inn", "hostel"],
        "meals":       ["restaurant", "food", "dining", "lunch", "dinner", "breakfast", "meal allowance"],
    },
    "technology": {
        "hardware":    ["laptop", "server", "hardware", "equipment", "device", "monitor", "printer"],
        "development": ["development", "api", "domain", "hosting", "cdn", "ssl"],
    },
    "transfer": {
        "internal":    ["internal transfer", "sweep", "account transfer", "intercompany"],
        "external":    ["wire", "neft", "imps", "rtgs", "remittance"],
    },
}


def _match_category(description: str):
    """Return (category, sub_category, confidence) from description matching."""
    desc_lower = description.lower()
    
    best_cat = "uncategorized"
    best_sub = "other"
    best_conf = 0.0

    for category, subcats in CATEGORY_RULES.items():
        for subcat, keywords in subcats.items():
            for kw in keywords:
                if kw in desc_lower:
                    # Longer keyword match = higher confidence
                    conf = min(0.95, 0.6 + len(kw) / 50)
                    if conf > best_conf:
                        best_cat = category
                        best_sub = subcat
                        best_conf = conf
    
    if best_conf == 0:
        best_conf = 0.3  # low-confidence uncategorized

    return best_cat, best_sub, round(best_conf, 2)


def categorize(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply category engine to each transaction.
    Adds 'category', 'sub_category', and 'confidence' columns.
    """
    results = df["description"].apply(lambda d: _match_category(str(d)))
    df["category"]     = results.apply(lambda x: x[0])
    df["sub_category"] = results.apply(lambda x: x[1])
    df["confidence"]   = results.apply(lambda x: x[2])
    
    # Override: transfers should always be type='transfer'
    transfer_mask = df["category"] == "transfer"
    df.loc[transfer_mask, "type"] = "transfer"

    # Override: payroll / revenue = income
    income_cats = ["payroll", "revenue"]
    df.loc[df["category"].isin(income_cats), "type"] = "income"
    df.loc[df["category"].isin(income_cats), "amount"] = df.loc[df["category"].isin(income_cats), "amount"].abs()

    return df
