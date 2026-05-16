import pandas as pd
from dental_agent.config.settings import CSV_PATH
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
def get_available_slots(doctor_name: str) -> list[dict]:
    """
    Return all available slots for a given doctor.
    """
    df = pd.read_csv(CSV_PATH)
    df.columns = df.columns.str.strip()
    doc = doctor_name.lower().strip()
    rows = df[(df["doctor_name"].str.lower().str.strip() == doc) & (df["is_available"].astype(str).str.upper() == "TRUE")]
    return rows.to_dict(orient="records")

@tool
def check_slot_availability(doctor_name: str, date_slot: str) -> dict:
    """
    Check if a specific slot is available for a given doctor.
    """
    df = pd.read_csv(CSV_PATH)
    df.columns = df.columns.str.strip()
    doc = doctor_name.lower().strip()

    try:
        target_dt = pd.to_datetime(date_slot, errors="coerce")
    except Exception:
        return {"success": False, "message": f"Invalid date format: {date_slot}"}

    mask = (df["doctor_name"].str.lower().str.strip() == doc) & (pd.to_datetime(df["date_slot"], errors="coerce") == target_dt)
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
