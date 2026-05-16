from fastapi import FastAPI

app = FastAPI()

@app.get("/api/doctors")
def get_doctors():
    return [
        {"id": 1, "name": "Dr. Sharma", "specialization": "Dentist"},
        {"id": 2, "name": "Dr. Mehta", "specialization": "Orthodontist"}
    ]

@app.get("/api/appointments")
def get_appointments(patient_id: int):
    if patient_id == 10084:
        return [
            {"id": 1, "patient_id": patient_id, "doctor_id": 1, "date": "2026-05-12", "time": "10:00"}
        ]
    return {"message": "No appointments found"}
