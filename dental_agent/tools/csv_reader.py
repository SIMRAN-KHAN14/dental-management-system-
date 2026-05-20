import pandas as pd
from dental_agent.config.settings import CSV_PATH
from dental_agent.tools.date_utils import parse_date_slot
from langchain_core.tools import tool

def show_csv():
    df = pd.read_csv(CSV_PATH)
    print(df[["doctor_name", "date_slot", "is_available", "patient_to_attend"]])

@tool
def get_patient_appointments(patient_id: str) -> list[dict]:
    """
    Return all appointments for a given patient ID.
    """
    df = pd.read_csv(CSV_PATH)
    df.columns = df.columns.str.strip()
    pid = str(patient_id).strip()
    rows = df[df["patient_to_attend"] == pid]
    return rows.to_dict(orient="records")

@tool
def get_available_slots(
    specialization: str = "",
    doctor_name: str = "",
    date_filter: str = "",
) -> list[dict]:
    """
    Return available appointment slots.

    Args:
        specialization: Optional specialty filter (e.g. orthodontist).
        doctor_name: Optional doctor name filter.
        date_filter: Optional date prefix YYYY-MM-DD or M/D/YYYY.
    """
    df = pd.read_csv(CSV_PATH)
    df.columns = df.columns.str.strip()
    mask = df["is_available"].astype(str).str.upper() == "TRUE"

    if doctor_name and doctor_name.strip():
        doc = doctor_name.lower().strip()
        mask &= df["doctor_name"].str.lower().str.strip() == doc

    if specialization and specialization.strip():
        spec = specialization.lower().strip().replace("_", " ")
        mask &= df["specialization"].str.lower().str.strip().str.replace("_", " ") == spec

    if date_filter and date_filter.strip():
        try:
            prefix = pd.to_datetime(date_filter.strip()).strftime("%Y-%m-%d")
        except Exception:
            prefix = date_filter.strip()
        mask &= df["date_slot"].astype(str).str.startswith(prefix)

    rows = df[mask].head(50)
    return rows.to_dict(orient="records")

@tool
def check_slot_availability(doctor_name: str, date_slot: str) -> dict:
    """
    Check if a specific slot is available for a given doctor.
    """
    df = pd.read_csv(CSV_PATH)
    df.columns = df.columns.str.strip()
    doc = doctor_name.lower().strip()

    target_dt = parse_date_slot(date_slot)
    if target_dt is None:
        return {"success": False, "message": f"Invalid date format: {date_slot}"}

    mask = (df["doctor_name"].str.lower().str.strip() == doc) & (
        pd.to_datetime(df["date_slot"], errors="coerce") == target_dt
    )
    rows = df[mask]

    if rows.empty:
        return {"success": False, "message": f"No slot {date_slot} found for {doctor_name}."}

    available = str(rows.iloc[0]["is_available"]).upper() == "TRUE"
    return {"success": True, "available": available}

@tool
def list_doctors_by_specialization(specialization: str) -> list[str]:
    """
    Return a list of doctor names for a given specialization.
    """
    df = pd.read_csv(CSV_PATH)
    df.columns = df.columns.str.strip()
    spec = specialization.lower().strip()
    rows = df[df["specialization"].str.lower().str.strip() == spec]
    doctors = rows["doctor_name"].unique().tolist()
    return doctors
