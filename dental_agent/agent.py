import os
from dotenv import load_dotenv

# Load .env from the same folder as this file
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI   # ✅ LangChain wrapper for Groq/OpenAI API
from dental_agent.tools.csv_reader import get_patient_appointments
from dental_agent.utils import sanitize_messages
from dental_agent.tools.csv_reader import (
    get_available_slots,
    get_patient_appointments,
    check_slot_availability,
    list_doctors_by_specialization,
)
from dental_agent.tools.csv_writer import (
    book_appointment,
    cancel_appointment,
    reschedule_appointment,
)

# Tools exported to the agent
TOOLS = [
    get_available_slots,                # specialization="", doctor_name="", date_filter=""
    get_patient_appointments,           # patient_id
    check_slot_availability,            # doctor_name, date_slot
    list_doctors_by_specialization,     # specialization
    book_appointment,                   # patient_id, doctor_name, date_slot
    cancel_appointment,                 # patient_id, date_slot
    reschedule_appointment,             # patient_id, current_date_slot, new_date_slot, doctor_name
]

SYSTEM_PROMPT = """
You are a helpful dental appointment assistant. You help patients with:
1. Checking available appointment slots and doctor information
2. Booking new appointments
3. Cancelling existing appointments
4. Rescheduling appointments

# Available Specializations
general_dentist, oral_surgeon, orthodontist, cosmetic_dentist,
prosthodontist, pediatric_dentist, emergency_dentist

# Date Format
Always use M/D/YYYY H:MM format – e.g. 5/10/2026 9:00

# Booking Rules
- Always call check_slot_availability before booking to confirm the slot is free
- If a slot is taken, call get_available_slots to suggest alternatives
- Always confirm cancellations before executing them
- Ask for one missing detail at a time – don't overwhelm the user

# Tool Usage
You have access to these functions:
- get_available_slots(specialization: str="", doctor_name: str="", date_filter: str="")
- get_patient_appointments(patient_id: str)
- check_slot_availability(doctor_name: str, date_slot: str)
- list_doctors_by_specialization(specialization: str)
- book_appointment(patient_id: str, doctor_name: str, date_slot: str)
- cancel_appointment(patient_id: str, date_slot: str)
- reschedule_appointment(patient_id: str, current_date_slot: str, new_date_slot: str, doctor_name: str)

Always call the correct tool with the required arguments. Do not invent new tool names.
"""

def _pre_model_hook(state: dict) -> dict:
    sanitized = sanitize_messages(state["messages"])
    return {"llm_input_messages": [SystemMessage(content=SYSTEM_PROMPT)] + sanitized}


def _read_env_values():
    api_key = os.getenv("GROQ_API_KEY")
    model_name = os.getenv("MODEL_NAME", "llama3-70b-8192")
    try:
        temperature = float(os.getenv("TEMPERATURE", "0"))
    except (TypeError, ValueError):
        temperature = 0.0
    return {"api_key": api_key, "model_name": model_name, "temperature": temperature}


_llm = None
_dental_graph = None


def get_llm():
    """
    Return a proper LangChain ChatOpenAI object configured for Groq.
    """
    env = _read_env_values()
    groq_key = env["api_key"]
    model = env["model_name"]
    temperature = env["temperature"]

    if groq_key:
        return ChatOpenAI(
            api_key=groq_key,
            base_url="https://api.groq.com/openai/v1",
            model=model,
            temperature=temperature,
        )
    else:
        raise RuntimeError("No valid GROQ_API_KEY found.")


def get_dental_graph():
    global _dental_graph
    if _dental_graph is not None:
        return _dental_graph

    llm = get_llm()
    _dental_graph = create_react_agent(
        model=llm,
        tools=TOOLS,
        pre_model_hook=_pre_model_hook,
    )
    return _dental_graph
