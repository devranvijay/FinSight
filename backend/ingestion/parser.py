"""
Transaction Parser – accepts CSV, Excel, and JSON uploads.
Normalizes columns to a standard schema before cleaning.
"""
import io
import uuid
import pandas as pd
from datetime import datetime
from typing import Optional


REQUIRED_COLUMNS_MAP = {
    # Canonical name -> list of possible source column names (case-insensitive)
    "date":         ["date", "transaction_date", "txn_date", "posted_date", "value_date", "trans_date"],
    "amount":       ["amount", "value", "debit_credit", "transaction_amount", "txn_amount"],
    "description":  ["description", "narration", "details", "memo", "remarks", "particulars", "reference"],
    "type":         ["type", "transaction_type", "txn_type", "credit_debit"],
}

AMOUNT_POSITIVE_TYPES   = ["credit", "income", "cr", "received", "deposit"]
AMOUNT_NEGATIVE_TYPES   = ["debit",  "expense", "dr", "payment", "withdrawal"]


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map varied source column names to standard names."""
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    rename_map = {}
    for canonical, variants in REQUIRED_COLUMNS_MAP.items():
        for col in df.columns:
            if col in variants and canonical not in df.columns:
                rename_map[col] = canonical
                break
    df.rename(columns=rename_map, inplace=True)
    return df


def _infer_type(row) -> str:
    """Infer transaction type from amount sign or type column."""
    if "type" in row.index and pd.notna(row["type"]):
        t = str(row["type"]).strip().lower()
        if any(pos in t for pos in AMOUNT_POSITIVE_TYPES):
            return "income"
        if any(neg in t for neg in AMOUNT_NEGATIVE_TYPES):
            return "expense"
        if "transfer" in t:
            return "transfer"
    # Fall back to amount sign
    try:
        amount = float(row.get("amount", 0))
        return "income" if amount >= 0 else "expense"
    except (ValueError, TypeError):
        return "expense"


def parse_csv(file_bytes: bytes, encoding: str = "utf-8") -> pd.DataFrame:
    """Parse a CSV file into a raw DataFrame."""
    try:
        df = pd.read_csv(io.BytesIO(file_bytes), encoding=encoding)
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin-1")
    return df


def parse_excel(file_bytes: bytes) -> pd.DataFrame:
    """Parse an Excel file into a raw DataFrame."""
    df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
    return df


def parse_json_records(data: list) -> pd.DataFrame:
    """Parse a list of JSON records into a raw DataFrame."""
    return pd.DataFrame(data)


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize a raw DataFrame into the canonical transaction schema.
    Returns a clean DataFrame ready for the cleaning pipeline.
    """
    df = _normalize_columns(df)

    # Ensure minimum required columns exist
    for col in ["date", "amount", "description"]:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' not found. Available: {list(df.columns)}")

    # Assign unique IDs
    df["id"] = [str(uuid.uuid4()) for _ in range(len(df))]

    # Parse dates
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # Parse amounts — strip currency symbols
    if df["amount"].dtype == object:
        df["amount"] = (
            df["amount"]
            .astype(str)
            .str.replace(r"[£$€,\s]", "", regex=True)
            .str.replace(r"\((.+)\)", r"-\1", regex=True)  # (500) → -500
        )
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

    # Infer type if not present
    if "type" not in df.columns:
        df["type"] = df.apply(_infer_type, axis=1)
    else:
        df["type"] = df.apply(_infer_type, axis=1)

    # Ensure amounts for expenses are negative, income positive
    df.loc[df["type"] == "expense", "amount"] = -df.loc[df["type"] == "expense", "amount"].abs()
    df.loc[df["type"] == "income", "amount"]  =  df.loc[df["type"] == "income", "amount"].abs()

    # Store raw description before any transformation
    df["raw_description"] = df["description"].astype(str)

    # Preserve account & counterparty if present
    df["account_id"]   = df.get("account_id",   pd.Series(["default"] * len(df)))
    df["counterparty"] = df.get("counterparty",  pd.Series([None] * len(df)))
    df["currency"]     = df.get("currency",       pd.Series(["USD"] * len(df)))

    # Select canonical columns only
    canonical = ["id", "date", "amount", "type", "description", "account_id",
                 "counterparty", "currency", "raw_description"]
    df = df[[c for c in canonical if c in df.columns]]
    return df
