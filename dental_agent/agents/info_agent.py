from langchain_core.prompts import ChatPromptTemplate
from langgraph.prebuilt import ToolNode
from dental_agent.models.state import AppointmentState
from dental_agent.llm import get_llm
from dental_agent.tools.csv_reader import (
    get_available_slots,
    get_patient_appointments,
    check_slot_availability,
    list_doctors_by_specialization,
)
from dental_agent.utils import sanitize_messages

INFO_TOOLS = [
    get_available_slots,
    get_patient_appointments,
    check_slot_availability,
    list_doctors_by_specialization,
]

INFO_SYSTEM = """You are the Information Agent for a dental appointment system.

Your role is to answer queries about doctor availability, schedules, and appointment status.

## Available Tools
- get_available_slots(specialization, doctor_name, date_filter) — find open slots
- get_patient_appointments(patient_id) — look up a patient's bookings
- check_slot_availability(doctor_name, date_slot) — verify a specific slot
- list_doctors_by_specialization(specialization) — list doctors in a specialty

## Guidelines
1. Use tools to fetch real data. Never invent slot times or doctor names.
2. If the user has not provided enough parameters, ask a focused clarifying question.
3. Present results in a clear, friendly, numbered list.
4. Valid specializations: general_dentist, oral_surgeon, orthodontist, cosmetic_dentist, prosthodontist, pediatric_dentist, emergency_dentist.
5. After answering, ask if the user needs anything else.

## Date Format
- date_filter: use YYYY-MM-DD (e.g., 2026-06-25)
- date_slot / appointments: M/D/YYYY H:MM or YYYY-MM-DD H:MM (use values returned by tools)
"""

INFO_PROMPT = ChatPromptTemplate.from_messages([
    ("system", INFO_SYSTEM),
    ("placeholder", "{messages}"),
])

info_tool_node = ToolNode(tools=INFO_TOOLS, handle_tool_errors=True)


def info_agent_node(state: AppointmentState) -> dict:
    llm = get_llm().bind_tools(INFO_TOOLS)

    chain = INFO_PROMPT | llm
    response = chain.invoke({"messages": sanitize_messages(state["messages"])})
    return {
        "messages": [response],
        "final_response": response.content if not response.tool_calls else None,
    }
