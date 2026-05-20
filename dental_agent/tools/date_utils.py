"""Normalize appointment date_slot strings for CSV matching."""
import pandas as pd


def parse_date_slot(date_slot: str):
    """Parse user or CSV date strings to pandas Timestamp (None if invalid)."""
    if not date_slot or not str(date_slot).strip():
        return None
    dt = pd.to_datetime(str(date_slot).strip(), errors="coerce")
    if pd.isna(dt):
        return None
    return dt
