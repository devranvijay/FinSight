import sqlite3
import json
from datetime import datetime


def log_action(
    user_id: str,
    action: str,
    resource: str,
    details: str = "",
    ip_address: str = "",
    status: str = "success"
):
    """Write an audit log entry to the database."""
    try:
        conn = sqlite3.connect("finsight.db", check_same_thread=False)
        conn.execute(
            """INSERT INTO audit_logs (user_id, action, resource, details, ip_address, status)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, action, resource, details, ip_address, status)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass  # Logging must never break the main flow
