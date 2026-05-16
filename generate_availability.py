import csv
import os
from datetime import date, timedelta

# Unified Schema: id,doctor_id,doctor_name,specialization,date_slot,is_available,patient_to_attend
BASE_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(BASE_DIR, "doctor_availability.csv")

DOCTORS = [
    (1, "Dr. Sharma", "Orthodontist"),
    (2, "Dr. Mehta", "Dentist"),
    (3, "Dr. Kapoor", "Endodontist"),
    (4, "Dr. Singh", "Periodontist"),
    (5, "Dr. Sarwar", "Prosthodontist"),
    (6, "Dr. Verma", "Oral Surgeon"),
    (7, "Dr. Gupta", "Pediatric Dentist"),
    (8, "Dr. Reddy", "Cosmetic Dentist"),
    (9, "Dr. Joshi", "Emergency Dentist"),
    (10, "Dr. Nair", "General Dentist"),
]

SLOTS = ["09:00", "10:30", "14:00", "15:30", "17:00"]

def generate():
    # Start from next Monday if possible, or just today
    start_date = date.today()
    # Find next Monday
    while start_date.weekday() != 0:
        start_date += timedelta(days=1)
        
    days_to_generate = 35 # 5 weeks
    
    rows = []
    slot_id = 1
    
    for i in range(days_to_generate):
        current_date = start_date + timedelta(days=i)
        if current_date.weekday() == 6: # Skip Sundays
            continue
            
        date_str = current_date.strftime("%Y-%m-%d")
        
        for doc_id, doc_name, spec in DOCTORS:
            for slot_time in SLOTS:
                rows.append([
                    slot_id,
                    doc_id,
                    doc_name,
                    spec,
                    f"{date_str} {slot_time}",
                    "TRUE",
                    ""
                ])
                slot_id += 1
                
    with open(CSV_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "doctor_id", "doctor_name", "specialization", "date_slot", "is_available", "patient_to_attend"])
        writer.writerows(rows)
    
    print(f"Generated {len(rows)} available slots for 35 days.")

if __name__ == "__main__":
    generate()
