"""
Exchange Rate Module — Static USD-base rates.
In production, replace with a live API (e.g. Open Exchange Rates, ECB).
"""

SUPPORTED_CURRENCIES = {
    "USD": {"symbol": "$",  "name": "US Dollar",          "rate": 1.0},
    "EUR": {"symbol": "€",  "name": "Euro",                "rate": 0.92},
    "GBP": {"symbol": "£",  "name": "British Pound",       "rate": 0.79},
    "INR": {"symbol": "₹",  "name": "Indian Rupee",        "rate": 83.12},
    "JPY": {"symbol": "¥",  "name": "Japanese Yen",        "rate": 149.50},
    "AUD": {"symbol": "A$", "name": "Australian Dollar",   "rate": 1.53},
    "CAD": {"symbol": "C$", "name": "Canadian Dollar",     "rate": 1.36},
    "CHF": {"symbol": "Fr", "name": "Swiss Franc",         "rate": 0.90},
    "SGD": {"symbol": "S$", "name": "Singapore Dollar",    "rate": 1.34},
    "AED": {"symbol": "د.إ","name": "UAE Dirham",          "rate": 3.67},
}


def convert(amount_usd: float, to_currency: str) -> float:
    """Convert a USD amount to the target currency."""
    rate = SUPPORTED_CURRENCIES.get(to_currency, SUPPORTED_CURRENCIES["USD"])["rate"]
    return round(amount_usd * rate, 2)


def get_symbol(currency: str) -> str:
    return SUPPORTED_CURRENCIES.get(currency, SUPPORTED_CURRENCIES["USD"])["symbol"]


def get_all_rates() -> dict:
    return {
        code: {"symbol": v["symbol"], "name": v["name"], "rate": v["rate"]}
        for code, v in SUPPORTED_CURRENCIES.items()
    }
