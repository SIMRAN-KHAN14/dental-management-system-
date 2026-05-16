import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent  

# Path to appointments CSV
CSV_PATH = str(BASE_DIR / "doctor_availability.csv")
# API settings
GROQ_API_KEY = "API KEY"
MODEL_NAME = os.getenv("MODEL_NAME", "grok-4")
TEMPERATURE = float(os.getenv("TEMPERATURE", "0"))

# Valid values
VALID_SPECIALIZATIONS = [
    "orthodontist",
    "dentist",
    "endodontist",
    "periodontist",
    "prosthodontist",
    "oral surgeon",
    "pediatric dentist",
]

VALID_DOCTORS = [
    "dr. sharma",
    "dr. mehta",
    "dr. kapoor",
    "dr. singh",
    "dr. sarwar",
    "dr. verma",
    "dr. gupta",
]

DATE_FORMAT = "%-m/%-d/%Y %-H:%M"
