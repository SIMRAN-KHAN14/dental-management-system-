import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent  

# Path to appointments CSV
CSV_PATH =str(BASE_DIR / "data" / "appointments.csv")
# API settings
GROQ_API_KEY = "API KEY"
MODEL_NAME = os.getenv("MODEL_NAME", "grok-4")
TEMPERATURE = float(os.getenv("TEMPERATURE", "0"))

# Valid values
VALID_SPECIALIZATIONS = [
    "general_dentist",
    "oral_surgeon",
    "orthodontist",
    "cosmetic_dentist",
    "prosthodontist",
    "pediatric_dentist",
    "emergency_dentist",
]

VALID_DOCTORS = [
    "john doe",
    "emily johnson",
    "sarah wilson",
    "jane smith",
    "michael green",
    "robert martinez",
    "lisa brown",
    "susan davis",
    "daniel miller",
    "kevin anderson",
]

DATE_FORMAT = "%-m/%-d/%Y %-H:%M"
